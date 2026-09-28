/**
 * Which dashboards each moderator can and cannot manage — for TC 4.2.1 / 4.2.5.
 *
 * READ-ONLY — performs no writes.
 *
 * A moderator manages the folders listed in `folders.assignedModerators[]` and
 * every folder below them. TC 4.2.5 needs a dashboard *outside* that scope,
 * and it has to be a real id: a made-up one only proves "not found", which
 * TC 3.10.24 already covers. (The first 4.2.5 run on 2026-09-28 used the
 * placeholder text from the test instructions and proved nothing.)
 *
 * Prints, per moderator: the assigned folders, how many dashboards are inside
 * and outside, and a few outside ids with a ready-to-open URL.
 *
 * Auth: GOOGLE_SERVICE_ACCOUNT_KEY (or GOOGLE_APPLICATION_CREDENTIALS) from
 * .env.local, like scripts/audit-orphans.mjs.
 *
 * Run:  node scripts/qa-moderator-scope.mjs
 */
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const PROD_URL = 'https://streamhub-1c27a.web.app'

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
const [users, folders, dashboards] = await Promise.all(['users', 'folders', 'dashboards'].map(getAll))

const folderName = id => folders.find(f => f._id === id)?.name ?? id
const moderators = users.filter(u => u.role === 'moderator')

if (moderators.length === 0) {
  console.log('No moderator accounts — TC 4.2.x needs one.')
  process.exit(0)
}

for (const m of moderators) {
  const uid = m.uid ?? m._id
  const assigned = folders.filter(f => (f.assignedModerators ?? []).includes(uid)).map(f => f._id)

  // Scope = assigned folders plus every descendant.
  const scope = new Set(assigned)
  for (let grew = true; grew;) {
    grew = false
    for (const f of folders) {
      if (f.parentId && scope.has(f.parentId) && !scope.has(f._id)) {
        scope.add(f._id)
        grew = true
      }
    }
  }

  const inside = dashboards.filter(d => scope.has(d.folderId))
  const outside = dashboards.filter(d => !scope.has(d.folderId))

  console.log(`\n👤 ${m.name ?? uid} (${m.email ?? uid})`)
  console.log(`   assigned: ${assigned.map(folderName).join(', ') || '(none)'}`)
  console.log(`   dashboards inside: ${inside.length} · outside: ${outside.length}`)
  for (const d of outside.slice(0, 3)) {
    console.log(`   outside → ${d._id}  "${d.name}" @ ${folderName(d.folderId)}`)
    console.log(`             ${PROD_URL}/manage/permissions?dashboard=${d._id}`)
  }
}

console.log('\n(read-only — no writes)')
