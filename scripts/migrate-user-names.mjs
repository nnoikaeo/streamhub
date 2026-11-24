/**
 * Move `users.name` to `users.firstName` + `users.lastName`, then drop `name`.
 *
 * Users used to carry one name string, filled from the Google account at
 * invite time. The One Data team keys people by ชื่อ and นามสกุล (their PIC
 * sheet), so the app now stores the two parts and reads them through
 * `fullName` / `userLabel` (shared/utils/userName.ts). Two steps, run apart:
 *
 *   split      — write firstName / lastName from `name`, split at the first
 *                space. Leaves `name` in place: a tab still open on the old
 *                build reads it until it reloads. Skips a user who already has
 *                either part, so a name an admin corrected is never overwritten.
 *   drop-name  — delete `name` from every user, once the new build is live and
 *                the split has been checked. Refuses a user whose `name` would
 *                be the only copy of their name (no firstName / lastName yet).
 *
 * The split is a guess — "ช่าง STSB" becomes ชื่อ "ช่าง", นามสกุล "STSB".
 * The dry run prints every row so the guesses are seen before anything is
 * written; fix the wrong ones on /admin/users afterwards.
 *
 * Auth: reads GOOGLE_SERVICE_ACCOUNT_KEY (or GOOGLE_APPLICATION_CREDENTIALS)
 * from .env.local — same as scripts/audit-orphans.mjs.
 *
 * Run:  node scripts/migrate-user-names.mjs split                # dry run
 *       node scripts/migrate-user-names.mjs split --apply
 *       node scripts/migrate-user-names.mjs drop-name            # dry run
 *       node scripts/migrate-user-names.mjs drop-name --apply
 *
 * NOTE: local dev points at the PRODUCTION Firestore (no emulator). `--apply`
 * writes to real production data, in one batch per step.
 */
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
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

const [STEP, ...flags] = process.argv.slice(2)
const APPLY = flags.includes('--apply')

if (STEP !== 'split' && STEP !== 'drop-name') {
  console.error('usage: node scripts/migrate-user-names.mjs split|drop-name [--apply]')
  process.exit(1)
}

/** Same rule as splitName in shared/utils/userName.ts — keep the two in step. */
function splitName(name) {
  const trimmed = typeof name === 'string' ? name.trim().replace(/\s+/g, ' ') : ''
  const space = trimmed.indexOf(' ')
  if (space === -1) return { firstName: trimmed, lastName: '' }
  return { firstName: trimmed.slice(0, space), lastName: trimmed.slice(space + 1) }
}

const hasText = (value) => typeof value === 'string' && value.trim() !== ''

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

console.log(`\n👤 users.name → firstName / lastName — step "${STEP}"   (${APPLY ? '⚠️  APPLY — will write' : 'dry run — no writes'})\n`)

const snap = await db.collection('users').get()
const batch = db.batch()
let writes = 0

if (STEP === 'split') {
  const rows = []
  for (const doc of snap.docs) {
    const u = doc.data()
    if (hasText(u.firstName) || hasText(u.lastName)) {
      rows.push({ email: u.email, name: u.name ?? '', firstName: u.firstName ?? '', lastName: u.lastName ?? '', action: 'มีชื่อแล้ว — ข้าม' })
      continue
    }
    if (!hasText(u.name)) {
      rows.push({ email: u.email, name: '', firstName: '', lastName: '', action: 'ไม่มีชื่อเดิม — ข้าม' })
      continue
    }
    const parts = splitName(u.name)
    rows.push({ email: u.email, name: u.name, ...parts, action: 'เขียน' })
    batch.update(doc.ref, { firstName: parts.firstName, lastName: parts.lastName })
    writes++
  }
  console.table(rows)
} else {
  const rows = []
  let refused = 0
  for (const doc of snap.docs) {
    const u = doc.data()
    if (!('name' in u)) continue
    if (hasText(u.name) && !hasText(u.firstName) && !hasText(u.lastName)) {
      rows.push({ email: u.email, name: u.name, action: '❌ ยังไม่มี firstName/lastName — รัน split ก่อน' })
      refused++
      continue
    }
    rows.push({ email: u.email, name: u.name, firstName: u.firstName ?? '', lastName: u.lastName ?? '', action: 'ลบ name' })
    batch.update(doc.ref, { name: FieldValue.delete() })
    writes++
  }
  if (rows.length) console.table(rows)
  else console.log('ไม่มีผู้ใช้คนไหนเหลือ name แล้ว')
  if (refused) {
    console.error(`\n❌ ${refused} คนยังมีชื่อแค่ใน name — ไม่เขียนอะไรเลย รัน "split" ก่อน`)
    process.exit(1)
  }
}

console.log(`\n${writes} คนจะถูกแก้ จากทั้งหมด ${snap.size} คน`)

if (!APPLY) {
  console.log('dry run — ไม่ได้เขียน ใส่ --apply เพื่อเขียนจริง\n')
  process.exit(0)
}
if (writes === 0) {
  console.log('ไม่มีอะไรต้องเขียน\n')
  process.exit(0)
}
await batch.commit()
console.log(`✅ เขียนแล้ว ${writes} คน (batch เดียว)\n`)
