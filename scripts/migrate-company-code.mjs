/**
 * Rename a company code (= the Firestore document id).
 *
 * `companies` uses the company `code` as its document id, and Firestore cannot
 * rename a document — so the admin UI locks the field once a company exists.
 * This script performs the equivalent move in a single atomic batch:
 *
 *   1. copy companies/<OLD> to companies/<NEW> (same data, `code` set to NEW)
 *   2. repoint every users.company === OLD to NEW
 *   3. delete companies/<OLD>
 *
 * Deliberately NOT rewritten:
 *   • invitations.company — an accepted/expired invitation is a historical record
 *   • audit-log           — an audit trail must stay as it was written
 * Both are reported so the leftovers are a decision, not a surprise.
 *
 * Refuses to run when the rename would leave dangling references it does not
 * handle (dashboards / folders / groups holding the old code).
 *
 * Auth: reads GOOGLE_SERVICE_ACCOUNT_KEY (or GOOGLE_APPLICATION_CREDENTIALS)
 * from .env.local — same as scripts/audit-orphans.mjs.
 *
 * Run:  node scripts/migrate-company-code.mjs OLD NEW          # dry run, writes nothing
 *       node scripts/migrate-company-code.mjs OLD NEW --apply  # commit the batch
 *
 * NOTE: local dev points at the PRODUCTION Firestore (no emulator). `--apply`
 * writes to real production data.
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

const [OLD, NEW, ...flags] = process.argv.slice(2)
const APPLY = flags.includes('--apply')

if (!OLD || !NEW) {
  console.error('usage: node scripts/migrate-company-code.mjs <OLD_CODE> <NEW_CODE> [--apply]')
  process.exit(1)
}
if (OLD === NEW) {
  console.error('❌ OLD and NEW are the same code — nothing to do')
  process.exit(1)
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

console.log(`\n🏷️  Company code ${OLD} → ${NEW}   (${APPLY ? '⚠️  APPLY — will write' : 'dry run — no writes'})\n`)

// ── Preconditions ───────────────────────────────────────────────────────────
const oldRef = db.doc(`companies/${OLD}`)
const newRef = db.doc(`companies/${NEW}`)
const [oldSnap, newSnap] = await Promise.all([oldRef.get(), newRef.get()])

if (!oldSnap.exists) {
  console.error(`❌ companies/${OLD} does not exist`)
  process.exit(1)
}
if (newSnap.exists) {
  console.error(`❌ companies/${NEW} already exists — pick a free code or merge by hand`)
  process.exit(1)
}

const company = oldSnap.data()
console.log(`✔ companies/${OLD} found: "${company.name}" (region=${company.region ?? '—'}, sortOrder=${company.sortOrder ?? '—'})`)
console.log(`✔ companies/${NEW} is free\n`)

// ── Scan every collection for the old code ──────────────────────────────────
const COLLECTIONS = ['users', 'dashboards', 'folders', 'groups', 'invitations', 'audit-log']

const findPaths = (value, path, out) => {
  if (value === OLD) out.push(path || '(root)')
  else if (Array.isArray(value)) value.forEach((v, i) => findPaths(v, `${path}[${i}]`, out))
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) findPaths(v, path ? `${path}.${k}` : k, out)
  }
}

const refs = {}
for (const name of COLLECTIONS) {
  const snap = await db.collection(name).get()
  refs[name] = []
  for (const doc of snap.docs) {
    const paths = []
    findPaths(doc.data(), '', paths)
    if (paths.length) refs[name].push({ id: doc.id, paths, data: doc.data() })
  }
}

const usersToMove = refs.users.filter(u => u.paths.includes('company'))
const usersOther = refs.users.filter(u => !u.paths.includes('company'))
const blocked = [...refs.dashboards, ...refs.folders, ...refs.groups, ...usersOther]

console.log('References to the old code:')
console.log(`  users.company      : ${usersToMove.length}  → will be repointed`)
for (const u of usersToMove) console.log(`      • ${u.id}  ${u.data.name ?? ''} <${u.data.email ?? ''}>`)
console.log(`  invitations        : ${refs.invitations.length}  → left as-is (historical record)`)
for (const i of refs.invitations) console.log(`      • ${i.id}  status=${i.data.status ?? '—'} <${i.data.email ?? ''}>`)
console.log(`  audit-log          : ${refs['audit-log'].length}  → left as-is (audit trail is immutable)`)
console.log(`  dashboards/folders/groups/other: ${blocked.length}`)
for (const b of blocked) console.log(`      • ${b.id}  ${b.paths.join(', ')}`)

if (blocked.length > 0) {
  console.error(`\n❌ Refusing to run: ${blocked.length} reference(s) this script does not know how to move.`)
  console.error('   Handle them first, then re-run.')
  process.exit(1)
}

// ── Plan ────────────────────────────────────────────────────────────────────
console.log('\nPlanned batch:')
console.log(`  set    companies/${NEW}   (copy of ${OLD}, code="${NEW}", updatedAt=now)`)
for (const u of usersToMove) console.log(`  update users/${u.id}  company: "${OLD}" → "${NEW}"`)
console.log(`  delete companies/${OLD}`)

if (!APPLY) {
  console.log('\n💡 Dry run only. Re-run with --apply to commit this batch.\n')
  process.exit(0)
}

// ── Apply (single atomic batch) ─────────────────────────────────────────────
const batch = db.batch()
batch.set(newRef, { ...company, code: NEW, updatedAt: FieldValue.serverTimestamp() })
for (const u of usersToMove) {
  batch.update(db.doc(`users/${u.id}`), { company: NEW, updatedAt: FieldValue.serverTimestamp() })
}
batch.delete(oldRef)
await batch.commit()

console.log('\n✅ Batch committed. Verifying...')

const [after, gone] = await Promise.all([newRef.get(), oldRef.get()])
console.log(`  companies/${NEW} exists: ${after.exists}  code="${after.data()?.code}"`)
console.log(`  companies/${OLD} deleted: ${!gone.exists}`)
for (const u of usersToMove) {
  const snap = await db.doc(`users/${u.id}`).get()
  console.log(`  users/${u.id} company="${snap.data()?.company}"`)
}
console.log('\nRun `npm run audit:orphans` for a full dangling-reference check.\n')
