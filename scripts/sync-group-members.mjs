/**
 * Rebuild groups.members[] from users.groups[].
 *
 * Membership is stored on both sides and the two drift: accepting an
 * invitation wrote only users.groups[] until the fix that ships with this
 * script, so on 2026-09-30 the `admin` group listed no members while three
 * admins named it. The server grants access from users.groups[]
 * (server/utils/companyAccess.ts), so that side is the truth and members[] is
 * rewritten to match it:
 *
 *   add    — a user names the group, members[] does not list them
 *   remove — members[] lists an existing user who does not name the group
 *
 * A uid in members[] that belongs to no user is left alone — that is a dead
 * reference, and scripts/clean-orphan-refs.mjs removes those.
 *
 * Dry run by default; nothing is written without --apply. Writes go in one
 * batch, so a failure part-way leaves the database as it was.
 *
 *   node scripts/sync-group-members.mjs            # show what would change
 *   node scripts/sync-group-members.mjs --apply    # commit it
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

const [groups, users] = await Promise.all(['groups', 'users'].map(getAll))
const userIds = new Set(users.map(u => u._id))

const changes = groups
  .map(g => {
    const current = g.members ?? []
    const naming = users.filter(u => (u.groups ?? []).includes(g._id)).map(u => u._id)
    const add = naming.filter(uid => !current.includes(uid))
    const remove = current.filter(uid => userIds.has(uid) && !naming.includes(uid))
    const after = [...current.filter(uid => !remove.includes(uid)), ...add]
    return { id: g._id, name: g.name ?? '?', current, add, remove, after }
  })
  .filter(c => c.add.length || c.remove.length)

const label = uid => users.find(u => u._id === uid)?.email ?? uid

console.log(`\n📊 groups=${groups.length} users=${users.length}\n`)

if (changes.length === 0) {
  console.log('✅ In sync — every group\'s members[] matches the users that name it.\n')
  process.exit(0)
}

for (const c of changes) {
  console.log(`— groups/${c.id} "${c.name}"`)
  if (c.add.length) console.log(`   add   : ${c.add.map(label).join(', ')}`)
  if (c.remove.length) console.log(`   remove: ${c.remove.map(label).join(', ')}`)
  console.log(`   before: ${JSON.stringify(c.current)}`)
  console.log(`   after : ${JSON.stringify(c.after)}`)
}

if (!apply) {
  console.log(`\n🔍 Dry run — ${changes.length} group(s) would change. Re-run with --apply to commit.\n`)
  process.exit(0)
}

const batch = db.batch()
for (const c of changes) {
  batch.update(db.collection('groups').doc(c.id), { members: c.after })
}
await batch.commit()

console.log(`\n✅ Synced ${changes.length} group(s). Confirm with: npm run audit:orphans\n`)
process.exit(0)
