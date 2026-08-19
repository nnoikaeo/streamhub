/**
 * Strip dangling ids out of the array fields that hold them.
 *
 * Companion to scripts/audit-orphans.mjs, which reports. This one removes —
 * but only the three cases where removal is the whole answer, because the
 * array simply names ids that no longer exist:
 *
 *   1. users.groups[]                → missing group
 *   2. groups.members[]              → missing user
 *   3. folders.assignedModerators[]  → missing user
 *
 * The other things audit reports are deliberately left alone: a dashboard
 * whose folderId is gone, a sub-folder whose parent is gone, a user whose
 * company is gone. Those are single-value pointers, so "clean" would mean
 * choosing a new home for the record — a decision, not a cleanup.
 *
 * Dry run by default; nothing is written without --apply. Writes go in one
 * batch, so a failure part-way leaves the database as it was.
 *
 *   node scripts/clean-orphan-refs.mjs              # show what would change
 *   node scripts/clean-orphan-refs.mjs --apply      # commit it
 *
 * NOTE: local dev points at the PRODUCTION Firestore. Verify with
 * `npm run audit:orphans` before and after.
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

const apply = process.argv.includes('--apply')

const getAll = async (name) => (await db.collection(name).get()).docs.map(d => ({ _id: d.id, ...d.data() }))

const [folders, groups, users] = await Promise.all(['folders', 'groups', 'users'].map(getAll))

const groupIds = new Set(groups.map(g => g._id))
const userIds = new Set(users.map(u => u._id))

/**
 * Build the change set for one array field.
 * `alive` decides which ids survive; only documents that actually lose
 * something end up in the list.
 */
const planField = (collection, docs, field, alive, label) =>
  docs
    .map(doc => {
      const current = doc[field] ?? []
      const kept = current.filter(alive)
      return { collection, docId: doc._id, field, label: label(doc), current, kept, dropped: current.filter(id => !alive(id)) }
    })
    .filter(change => change.dropped.length > 0)

const changes = [
  ...planField('users', users, 'groups', id => groupIds.has(id), u => u.email ?? u.name ?? '?'),
  ...planField('groups', groups, 'members', id => userIds.has(id), g => g.name ?? '?'),
  ...planField('folders', folders, 'assignedModerators', id => userIds.has(id), f => f.name ?? '?'),
]

console.log(`\n📊 folders=${folders.length} groups=${groups.length} users=${users.length}\n`)

if (changes.length === 0) {
  console.log('✅ Nothing to clean — no dangling ids in groups[], members[] or assignedModerators[].\n')
  process.exit(0)
}

for (const c of changes) {
  console.log(`— ${c.collection}/${c.docId} "${c.label}" · ${c.field}`)
  console.log(`   drop  : ${JSON.stringify(c.dropped)}`)
  console.log(`   before: ${JSON.stringify(c.current)}`)
  console.log(`   after : ${JSON.stringify(c.kept)}`)
}

const droppedTotal = changes.reduce((n, c) => n + c.dropped.length, 0)
console.log(`\n${changes.length} document(s), ${droppedTotal} dangling id(s).`)

if (!apply) {
  console.log('\n🔍 Dry run — nothing written. Re-run with --apply to commit.\n')
  process.exit(0)
}

const batch = db.batch()
for (const c of changes) {
  batch.update(db.collection(c.collection).doc(c.docId), { [c.field]: c.kept })
}
await batch.commit()

console.log(`\n✅ Cleaned ${changes.length} document(s). Confirm with: npm run audit:orphans\n`)
process.exit(0)
