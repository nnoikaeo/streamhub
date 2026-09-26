/**
 * Move every sheet dashboard framed as `interactive` to `full` — the menu bar.
 *
 * `full` became the default on 2026-09-26 because the menu bar was asked for
 * on every sheet (docs/OPERATIONS/google-sheets-menubar-spike.md). A new
 * default only reaches dashboards saved after it; this brings the existing
 * ones along.
 *
 * The mode is not applied at render time — the stored `sheetEmbedUrl` IS the
 * framed URL — so both fields change together:
 *
 *   sheetEmbedMode  'interactive' (or absent)             → 'full'
 *   sheetEmbedUrl   …/d/{id}/edit?rm=minimal&widget=true&headers=false → …/d/{id}/edit
 *
 * Only that exact URL shape is rewritten. Anything else — a `view` sheet, a
 * published `/d/e/…/pubhtml` URL, a hand-edited URL — is listed and left alone,
 * so the report shows what was skipped and why rather than guessing.
 *
 * `updatedAt` is not touched: nobody edited these dashboards, and the Explorer
 * sorts on it.
 *
 * Auth: reads GOOGLE_SERVICE_ACCOUNT_KEY (or GOOGLE_APPLICATION_CREDENTIALS)
 * from .env.local — same as scripts/audit-orphans.mjs.
 *
 * Run:  node scripts/migrate-sheet-full-mode.mjs          # dry run, writes nothing
 *       node scripts/migrate-sheet-full-mode.mjs --apply  # commit one batch
 *
 * NOTE: local dev points at the PRODUCTION Firestore (no emulator). `--apply`
 * writes to real production data.
 */
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// Load .env.local manually (script runs outside Nuxt)
const envLocalPath = resolve(ROOT_DIR, '.env.local')
if (existsSync(envLocalPath)) {
  for (const line of readFileSync(envLocalPath, 'utf-8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i === -1) continue
    const k = t.slice(0, i).trim()
    let v = t.slice(i + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    if (!process.env[k]) process.env[k] = v
  }
}

const APPLY = process.argv.slice(2).includes('--apply')

if (getApps().length === 0) {
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  const path = process.env.GOOGLE_APPLICATION_CREDENTIALS
  if (key) initializeApp({ credential: cert(JSON.parse(key)) })
  else if (path) initializeApp()
  else {
    console.error('❌ No credentials. Set GOOGLE_SERVICE_ACCOUNT_KEY or GOOGLE_APPLICATION_CREDENTIALS in .env.local')
    process.exit(1)
  }
}
const db = getFirestore()

// Exactly what shared/utils/sheetUrl.ts builds for `interactive`. The `(?!e\/)`
// keeps a published `/d/e/…` URL out, as it does in the parser.
const INTERACTIVE_URL = /^(https:\/\/docs\.google\.com\/spreadsheets\/d\/(?!e\/)[a-zA-Z0-9_-]+)\/edit\?rm=minimal&widget=true&headers=false$/

console.log(`\n📊 Sheet dashboards: interactive → full   (${APPLY ? '⚠️  APPLY — will write' : 'dry run — no writes'})\n`)

const snap = await db.collection('dashboards').where('type', '==', 'sheet').get()

const toMigrate = []
const skipped = []

for (const doc of snap.docs) {
  const d = doc.data()
  const mode = d.sheetEmbedMode
  const url = d.sheetEmbedUrl ?? ''
  const label = `${doc.id}  ${d.name ?? '(no name)'}`

  if (mode === 'full') {
    skipped.push([label, 'already full'])
    continue
  }
  if (mode !== undefined && mode !== 'interactive') {
    skipped.push([label, `mode is '${mode}' — chosen on purpose, not the old default`])
    continue
  }
  const match = url.match(INTERACTIVE_URL)
  if (!match) {
    skipped.push([label, `URL is not the interactive shape: ${url || '(empty)'}`])
    continue
  }
  toMigrate.push({ ref: doc.ref, label, from: url, to: `${match[1]}/edit` })
}

console.log(`Found ${snap.size} sheet dashboard(s): ${toMigrate.length} to migrate, ${skipped.length} skipped\n`)

for (const m of toMigrate) {
  console.log(`  → ${m.label}`)
  console.log(`      ${m.from}`)
  console.log(`      ${m.to}`)
}
if (skipped.length) {
  console.log('\nSkipped:')
  for (const [label, why] of skipped) console.log(`  · ${label} — ${why}`)
}

if (!toMigrate.length) {
  console.log('\n✅ Nothing to migrate')
  process.exit(0)
}

if (!APPLY) {
  console.log('\nDry run — re-run with --apply to write')
  process.exit(0)
}

const batch = db.batch()
for (const m of toMigrate) {
  batch.update(m.ref, { sheetEmbedMode: 'full', sheetEmbedUrl: m.to })
}
await batch.commit()
console.log(`\n✅ Migrated ${toMigrate.length} dashboard(s)`)
