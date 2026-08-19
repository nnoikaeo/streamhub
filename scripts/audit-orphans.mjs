/**
 * Orphan / dangling-reference audit for the Firestore database.
 *
 * READ-ONLY — performs no writes. Cross-references collections and reports
 * documents whose foreign keys point at records that no longer exist. Useful
 * as a periodic data-hygiene check (e.g. after bulk deletes or QA sessions).
 *
 * Checks:
 *   1. dashboards.folderId        → missing folder      (orphan dashboard)
 *   2. folders.parentId           → missing folder      (orphan sub-folder)
 *   3. users.groups[]             → missing group       (dead group ref)
 *   4. companies.region           → missing region      (dead region ref)
 *   5. users.company              → missing company     (dead company ref)
 *   6. groups.members[]           → missing user        (dead member ref)
 *   7. folders.assignedModerators[] → missing user   (dead moderator ref)
 *
 * Auth: reads GOOGLE_SERVICE_ACCOUNT_KEY (or GOOGLE_APPLICATION_CREDENTIALS)
 * from .env.local — the same admin credentials used by scripts/seed-firestore.ts.
 *
 * Run:  npm run audit:orphans
 *
 * NOTE: local dev points at the PRODUCTION Firestore (no emulator), so this
 * audits real prod data. It never writes, but be aware of what you are reading.
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

const getAll = async (name) => (await db.collection(name).get()).docs.map(d => ({ _id: d.id, ...d.data() }))

const [folders, dashboards, groups, users, companies, regions] = await Promise.all(
  ['folders', 'dashboards', 'groups', 'users', 'companies', 'regions'].map(getAll)
)

const folderIds = new Set(folders.map(f => f._id))
const groupIds = new Set(groups.map(g => g._id))
const regionCodes = new Set(regions.map(r => r._id))
const userIds = new Set(users.map(u => u._id))
const companyCodes = new Set(companies.map(c => c._id))

console.log(`\n📊 folders=${folders.length} dashboards=${dashboards.length} groups=${groups.length} users=${users.length} companies=${companies.length} regions=${regions.length}\n`)

let total = 0
const report = (label, rows, fmt) => {
  console.log(`— ${label}: ${rows.length}`)
  for (const r of rows) console.log(`   • ${fmt(r)}`)
  total += rows.length
}

report('Orphan dashboards (folderId → missing folder)',
  dashboards.filter(d => d.folderId && !folderIds.has(d.folderId)),
  d => `docId=${d._id} name="${d.name ?? d.title ?? '?'}" folderId=${d.folderId}`)

report('Orphan folders (parentId → missing folder)',
  folders.filter(f => f.parentId && !folderIds.has(f.parentId)),
  f => `docId=${f._id} name="${f.name ?? '?'}" parentId=${f.parentId}`)

report('Users with dead group refs (user.groups[] → missing group)',
  users.map(u => ({ u, dead: (u.groups ?? []).filter(g => !groupIds.has(g)) })).filter(x => x.dead.length),
  x => `uid=${x.u._id} email=${x.u.email ?? '?'} dead=${JSON.stringify(x.dead)} all=${JSON.stringify(x.u.groups)}`)

report('Companies with missing region ref',
  companies.filter(c => c.region && !regionCodes.has(c.region)),
  c => `code=${c._id} name="${c.name ?? '?'}" region=${c.region}`)

// Deleting a company from /admin/companies does not touch its members, so a
// user can be left pointing at a company code that no longer exists.
report('Users with a dead company ref (user.company → missing company)',
  users.filter(u => u.company && !companyCodes.has(u.company)),
  u => `uid=${u._id} email=${u.email ?? '?'} name="${u.name ?? '?'}" company=${u.company}`)

report('Groups with dead member refs (group.members[] → missing user)',
  groups.map(g => ({ g, dead: (g.members ?? []).filter(m => !userIds.has(m)) })).filter(x => x.dead.length),
  x => `id=${x.g._id} name="${x.g.name ?? '?'}" dead=${JSON.stringify(x.dead)}`)

// A moderator's uid is named directly on each folder they manage, and deleting
// the account never touched it before BUG-005 — the folder kept a moderator who
// no longer exists, which no other check here would surface.
report('Folders with dead moderator refs (folder.assignedModerators[] → missing user)',
  folders
    .map(f => ({ f, dead: (f.assignedModerators ?? []).filter(m => !userIds.has(m)) }))
    .filter(x => x.dead.length),
  x => `id=${x.f._id} name="${x.f.name ?? '?'}" dead=${JSON.stringify(x.dead)}`)

console.log(`\n${total === 0 ? '✅ No orphans found.' : `⚠️  ${total} orphan reference(s) found.`} (read-only — no writes)\n`)
process.exit(0)
