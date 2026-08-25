/**
 * QA fixture for the user delete-cascade case (TC 3.2.11).
 *
 * The case needs an account that is referenced from both sides of the cascade —
 * named in a `group.members[]` and in a `folder.assignedModerators[]` — and then
 * deleted through /admin/users, so the confirm dialog can be read ("ถูกอ้างอิงอยู่
 * ใน 1 กลุ่ม และ 1 โฟลเดอร์ที่ดูแล") and the cleanup verified with the orphan audit.
 *
 * No such account can be created through the UI: accounts only come into
 * existence by accepting an invitation, and every real account in prod is in
 * use. So the fixture writes one directly, records what it changed, and can put
 * everything back.
 *
 * The seeded uid is prefixed `uid_qa_` and every command refuses to act on a uid
 * without that prefix, so restore can never delete a real account.
 *
 * Writes nothing without --apply. Every command prints the before/after first.
 *
 *   node scripts/qa-cascade-user.mjs status
 *   node scripts/qa-cascade-user.mjs seed             # dry run
 *   node scripts/qa-cascade-user.mjs seed --apply     # create the user + both refs
 *   node scripts/qa-cascade-user.mjs restore --apply  # remove it all again
 *
 * Restore is also the cleanup path when the UI delete under test *worked*: the
 * user doc is already gone and the two references were already stripped, so it
 * just puts the group and folder back to the values it recorded and drops the
 * state file. Run it either way before closing the session.
 *
 * The saved originals live in scripts/.qa-cascade-user-state.json (git-ignored).
 *
 *   npm run audit:orphans   # must report 0 in all seven categories when done
 *
 * NOTE: local dev points at the PRODUCTION Firestore. This writes real data.
 */
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const STATE_FILE = resolve(ROOT_DIR, 'scripts/.qa-cascade-user-state.json')

const QA_UID_PREFIX = 'uid_qa_'
const DEFAULT_UID = 'uid_qa_cascade'
const DEFAULT_GROUP = 'analytics'
// No default folder any more. TEST-E (`folder_1785082588448`) held that job
// and was deleted with the rest of the test data on 2026-08-25. Seeding writes
// into `folders.assignedModerators[]`, so defaulting to any surviving folder
// would mean editing a real one by omission. Pass --folder <id>.

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

const args = process.argv.slice(2)
const command = args.find(a => !a.startsWith('--')) ?? 'status'
const apply = args.includes('--apply')
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  return i !== -1 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : fallback
}
const uid = flag('uid', DEFAULT_UID)
const groupId = flag('group', DEFAULT_GROUP)
const folderId = flag('folder', null)
if (!folderId) {
  console.error('❌ --folder <id> is required.')
  console.error('')
  console.error('   There is no reserved QA folder any more. Create an empty throwaway')
  console.error('   folder with no assigned moderators, pass its id here, and run')
  console.error('   `restore` before deleting it again.')
  console.error('')
  console.error('   node scripts/qa-cascade-user.mjs seed --folder folder_xxx --apply')
  process.exit(1)
}

/**
 * The whole safety story rests on this prefix: restore deletes a user document
 * outright, so it may only ever address one this script created.
 */
if (!uid.startsWith(QA_UID_PREFIX)) {
  console.error(`❌ Refusing: uid "${uid}" does not start with "${QA_UID_PREFIX}".`)
  console.error('   This script creates and deletes accounts — it may only address its own fixtures.')
  process.exit(1)
}

const readDoc = async (collection, id, { required = true } = {}) => {
  const snap = await db.collection(collection).doc(id).get()
  if (!snap.exists && required) {
    console.error(`❌ ${collection}/${id} not found`)
    process.exit(1)
  }
  return snap.exists ? snap.data() : null
}

const readAll = async () => ({
  user: await readDoc('users', uid, { required: false }),
  group: await readDoc('groups', groupId),
  folder: await readDoc('folders', folderId),
})

const describe = ({ user, group, folder }) => {
  console.log(`\n👤 users/${uid}`)
  console.log(`   exists                : ${user !== null}`)
  if (user) console.log(`   email / role / groups : ${user.email} / ${user.role} / ${JSON.stringify(user.groups ?? [])}`)
  console.log(`\n👥 groups/${groupId} — ${group.name ?? '(no name)'}`)
  console.log(`   members               : ${JSON.stringify(group.members ?? [])}`)
  console.log(`\n📁 folders/${folderId} — ${folder.name ?? '(no name)'}`)
  console.log(
    `   assignedModerators    : ${
      folder.assignedModerators === undefined ? '(field absent)' : JSON.stringify(folder.assignedModerators)
    }`
  )
}

/**
 * The fixture adds a phantom member and a phantom moderator, so it may only run
 * against a group and a folder nobody is relying on — anything already carrying
 * real members or moderators is somebody's live configuration.
 */
const assertSafeTargets = ({ group, folder }) => {
  const realMembers = (group.members ?? []).filter(m => !m.startsWith(QA_UID_PREFIX))
  const realModerators = (folder.assignedModerators ?? []).filter(m => !m.startsWith(QA_UID_PREFIX))

  if (realMembers.length) {
    console.error(`\n❌ Refusing: groups/${groupId} already has real members (${realMembers.join(', ')}).`)
    console.error('   Pick an empty group with --group, so a failed restore cannot cost someone their membership.')
    process.exit(1)
  }
  if (realModerators.length) {
    console.error(`\n❌ Refusing: folders/${folderId} already has real moderators (${realModerators.join(', ')}).`)
    console.error('   Pick a folder with no assigned moderators using --folder.')
    process.exit(1)
  }
}

const loadState = () => (existsSync(STATE_FILE) ? JSON.parse(readFileSync(STATE_FILE, 'utf-8')) : null)

if (command === 'status') {
  describe(await readAll())
  const state = loadState()
  console.log(
    state
      ? `\n💾 Saved originals for ${state.uid}: groups/${state.groupId} members=${JSON.stringify(state.members)}, folders/${state.folderId} assignedModerators=${
          state.assignedModerators === null ? '(field absent)' : JSON.stringify(state.assignedModerators)
        }\n   Run: node scripts/qa-cascade-user.mjs restore --apply`
      : '\n💾 No saved originals — nothing to restore.'
  )
  process.exit(0)
}

if (command === 'seed') {
  const current = await readAll()
  assertSafeTargets(current)
  describe(current)

  if (loadState()) {
    console.error('\n❌ Originals are already saved — the fixture looks applied. Restore first.')
    process.exit(1)
  }
  if (current.user) {
    console.error(`\n❌ users/${uid} already exists. Restore first, or pick another uid with --uid.`)
    process.exit(1)
  }

  const members = current.group.members ?? []
  const moderators = current.folder.assignedModerators ?? []

  console.log('\n→ after:')
  console.log(`   users/${uid}                       : created (role=moderator, company=STTH, groups=["${groupId}"])`)
  console.log(`   groups/${groupId} members          : ${JSON.stringify([...members, uid])}`)
  console.log(`   folders/${folderId} assignedModerators : ${JSON.stringify([...moderators, uid])}`)
  console.log('\n   Expected dialog on delete: "ถูกอ้างอิงอยู่ใน 1 กลุ่ม และ 1 โฟลเดอร์ที่ดูแล"')

  if (!apply) {
    console.log('\n🔍 Dry run. Re-run with --apply to write.')
    process.exit(0)
  }

  // Record what was there first — including whether assignedModerators existed
  // at all, since restore has to remove the field rather than leave an empty
  // array the audit would still have to walk.
  writeFileSync(
    STATE_FILE,
    JSON.stringify(
      {
        uid,
        groupId,
        folderId,
        members,
        assignedModerators: current.folder.assignedModerators === undefined ? null : moderators,
        savedAt: new Date().toISOString(),
      },
      null,
      2
    )
  )

  const now = new Date()
  const batch = db.batch()
  batch.set(db.collection('users').doc(uid), {
    uid,
    email: `${uid}@qa.invalid`,
    name: 'QA Cascade Fixture',
    // Moderator so the folder assignment matches how the reference is created
    // for real; the cascade itself counts folders regardless of role.
    role: 'moderator',
    company: 'STTH',
    groups: [groupId],
    isActive: true,
    createdAt: now,
    updatedAt: now,
  })
  batch.update(db.collection('groups').doc(groupId), { members: [...members, uid] })
  batch.update(db.collection('folders').doc(folderId), { assignedModerators: [...moderators, uid] })
  await batch.commit()

  console.log(`\n✅ Applied. Originals saved to ${STATE_FILE}`)
  console.log('   Now delete the user at /admin/users, then: node scripts/qa-cascade-user.mjs restore --apply')
  process.exit(0)
}

if (command === 'restore') {
  const state = loadState()
  if (!state) {
    console.error('❌ No saved originals. Nothing to restore.')
    process.exit(1)
  }
  if (!state.uid.startsWith(QA_UID_PREFIX)) {
    console.error(`❌ Refusing: saved state names "${state.uid}", which is not a ${QA_UID_PREFIX} fixture.`)
    process.exit(1)
  }

  const current = {
    user: await readDoc('users', state.uid, { required: false }),
    group: await readDoc('groups', state.groupId),
    folder: await readDoc('folders', state.folderId),
  }
  console.log(`\n👤 users/${state.uid} exists: ${current.user !== null}${current.user ? '' : ' — already deleted (the UI delete under test did its job)'}`)
  console.log(`👥 groups/${state.groupId} members: ${JSON.stringify(current.group.members ?? [])}`)
  console.log(
    `📁 folders/${state.folderId} assignedModerators: ${
      current.folder.assignedModerators === undefined ? '(field absent)' : JSON.stringify(current.folder.assignedModerators)
    }`
  )

  console.log('\n→ restore to:')
  console.log(`   users/${state.uid}                       : deleted`)
  console.log(`   groups/${state.groupId} members          : ${JSON.stringify(state.members)}`)
  console.log(
    `   folders/${state.folderId} assignedModerators : ${
      state.assignedModerators === null ? '(field removed)' : JSON.stringify(state.assignedModerators)
    }`
  )

  if (!apply) {
    console.log('\n🔍 Dry run. Re-run with --apply to write.')
    process.exit(0)
  }

  const batch = db.batch()
  batch.delete(db.collection('users').doc(state.uid))
  batch.update(db.collection('groups').doc(state.groupId), { members: state.members })
  batch.update(db.collection('folders').doc(state.folderId), {
    assignedModerators: state.assignedModerators === null ? FieldValue.delete() : state.assignedModerators,
  })
  await batch.commit()

  unlinkSync(STATE_FILE)
  console.log('\n✅ Restored. Confirm with: npm run audit:orphans')
  process.exit(0)
}

console.error(`❌ Unknown command "${command}". Use: status | seed | restore`)
process.exit(1)
