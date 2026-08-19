/**
 * QA fixture for the dangling-reference cases (TC 6.2.1, TC 6.2.2).
 *
 * Both cases ask what the UI does with a reference that points at something
 * that no longer exists — an orphan `folderId`, a grant to a deleted user. The
 * app refuses to create either state on purpose (the delete guards from
 * BUG-008/009 exist precisely to prevent it), so the fixture has to be written
 * directly. Doing that by hand in the Firebase console is how test data gets
 * left behind, so this script owns the whole round trip: it records the
 * original values before touching anything and restores them from that record.
 *
 * Targets only the dashboard reserved for QA (`dash_1785082599181`, "Dashboard
 * in E", reach 0) unless --dashboard says otherwise, and refuses to touch a
 * dashboard that any user can currently reach.
 *
 * Writes nothing without --apply. Every command prints the before/after first.
 *
 *   node scripts/qa-broken-refs.mjs status
 *   node scripts/qa-broken-refs.mjs break            # dry run
 *   node scripts/qa-broken-refs.mjs break --apply    # set both broken refs
 *   node scripts/qa-broken-refs.mjs restore --apply  # put the originals back
 *
 * The saved originals live in scripts/.qa-broken-refs-state.json (git-ignored).
 * Restore reads that file, so run restore from the same checkout — and run it
 * before you close the session, or the audit will keep reporting the fixture:
 *   npm run audit:orphans
 *
 * NOTE: local dev points at the PRODUCTION Firestore. This writes real data.
 */
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const STATE_FILE = resolve(ROOT_DIR, 'scripts/.qa-broken-refs-state.json')

const GHOST_FOLDER = 'folder_ghost_qa'
const GHOST_USER = 'uid_ghost_qa'
const DEFAULT_DASHBOARD = 'dash_1785082599181'

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
const dashboardId = (() => {
  const i = args.indexOf('--dashboard')
  return i !== -1 && args[i + 1] ? args[i + 1] : DEFAULT_DASHBOARD
})()

const readDashboard = async () => {
  const snap = await db.collection('dashboards').doc(dashboardId).get()
  if (!snap.exists) {
    console.error(`❌ dashboards/${dashboardId} not found`)
    process.exit(1)
  }
  return snap.data()
}

const describe = (data) => {
  const access = data.access ?? {}
  console.log(`\n📄 dashboards/${dashboardId} — ${data.name ?? '(no name)'}`)
  console.log(`   folderId       : ${data.folderId ?? '(none)'}`)
  console.log(`   access.public  : ${access.public === true}`)
  console.log(`   access.users   : ${JSON.stringify(access.users ?? [])}`)
  console.log(`   access.groups  : ${JSON.stringify(access.groups ?? [])}`)
  console.log(`   access.company : ${JSON.stringify(access.company ?? [])}`)
}

/**
 * The fixture makes a dashboard temporarily wrong, so it may only run against
 * one nobody is relying on — a public dashboard or one with live grants would
 * show the broken state to real users.
 */
const assertSafeTarget = (data) => {
  const access = data.access ?? {}
  const reach = [
    access.public === true ? 'public' : null,
    (access.users ?? []).filter(u => u !== GHOST_USER).length ? 'user grants' : null,
    (access.groups ?? []).length ? 'group grants' : null,
    (access.company ?? []).length ? 'company grants' : null,
  ].filter(Boolean)

  if (reach.length) {
    console.error(`\n❌ Refusing: dashboards/${dashboardId} is reachable (${reach.join(', ')}).`)
    console.error('   Pick a dashboard nobody can currently see, or clear its access first.')
    process.exit(1)
  }
}

const loadState = () => (existsSync(STATE_FILE) ? JSON.parse(readFileSync(STATE_FILE, 'utf-8')) : null)

if (command === 'status') {
  describe(await readDashboard())
  const state = loadState()
  console.log(
    state
      ? `\n💾 Saved originals for ${state.dashboardId} (folderId=${state.folderId ?? '(none)'}, users=${JSON.stringify(state.users)})\n   Run: node scripts/qa-broken-refs.mjs restore --apply`
      : '\n💾 No saved originals — nothing to restore.'
  )
  process.exit(0)
}

if (command === 'break') {
  const data = await readDashboard()
  assertSafeTarget(data)
  describe(data)

  const users = data.access?.users ?? []
  if (loadState()) {
    console.error('\n❌ Originals are already saved — the fixture looks applied. Restore first.')
    process.exit(1)
  }

  console.log('\n→ after:')
  console.log(`   folderId     : ${GHOST_FOLDER}   (TC 6.2.1 — folder chip must render empty, not crash)`)
  console.log(`   access.users : ${JSON.stringify([...users, GHOST_USER])}   (TC 6.2.2 — permissions page must show the raw uid)`)

  if (!apply) {
    console.log('\n🔍 Dry run. Re-run with --apply to write.')
    process.exit(0)
  }

  writeFileSync(
    STATE_FILE,
    JSON.stringify({ dashboardId, folderId: data.folderId ?? null, users, savedAt: new Date().toISOString() }, null, 2)
  )
  await db.collection('dashboards').doc(dashboardId).update({
    folderId: GHOST_FOLDER,
    'access.users': [...users, GHOST_USER],
  })
  console.log(`\n✅ Applied. Originals saved to ${STATE_FILE}`)
  console.log('   Restore when done: node scripts/qa-broken-refs.mjs restore --apply')
  process.exit(0)
}

if (command === 'restore') {
  const state = loadState()
  if (!state) {
    console.error('❌ No saved originals. Nothing to restore.')
    process.exit(1)
  }

  const data = await readDashboard()
  describe(data)
  console.log('\n→ restore to:')
  console.log(`   folderId     : ${state.folderId ?? '(none)'}`)
  console.log(`   access.users : ${JSON.stringify(state.users)}`)

  if (!apply) {
    console.log('\n🔍 Dry run. Re-run with --apply to write.')
    process.exit(0)
  }

  await db.collection('dashboards').doc(state.dashboardId).update({
    folderId: state.folderId,
    'access.users': state.users,
  })
  unlinkSync(STATE_FILE)
  console.log('\n✅ Restored. Confirm with: npm run audit:orphans')
  process.exit(0)
}

console.error(`❌ Unknown command "${command}". Use: status | break | restore`)
process.exit(1)
