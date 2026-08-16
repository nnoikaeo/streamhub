/**
 * inspect-expiry.mjs — READ-ONLY inspection of `dashboards.restrictions.expiry`.
 *
 * Prints the runtime *shape* of every stored expiry value (Timestamp / string /
 * number / Date-like), what it resolves to, and whether it has passed — the
 * thing a Firebase console screenshot cannot tell you apart, since the console
 * renders an ISO string and a Timestamp almost identically.
 *
 * Also lists dashboard/user candidates for the end-to-end expiry test.
 *
 * Usage:
 *   node scripts/inspect-expiry.mjs              # summary of all dashboards
 *   node scripts/inspect-expiry.mjs <dashboardId>  # one dashboard, full detail
 *
 * Auth: reads GOOGLE_SERVICE_ACCOUNT_KEY (or GOOGLE_APPLICATION_CREDENTIALS)
 * from .env.local, same as scripts/audit-orphans.mjs.
 *
 * NEVER writes. Every code path here is a read.
 */

import { readFileSync } from 'node:fs'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

// ---------- env ----------
try {
  const text = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  for (const line of text.split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i < 0) continue
    const k = t.slice(0, i).trim()
    let v = t.slice(i + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    if (!process.env[k]) process.env[k] = v
  }
} catch {
  // .env.local optional when GOOGLE_APPLICATION_CREDENTIALS is already set
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

// ---------- shape probe (mirrors shared/utils/dates.ts toDate) ----------

/** Describe the runtime shape of a stored value, without trusting its type. */
function describeShape(value) {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (value instanceof Date) return 'Date'
  if (typeof value === 'string') return 'string'
  if (typeof value === 'number') return 'number'
  if (typeof value === 'object') {
    const ctor = value.constructor?.name ?? '(no ctor)'
    const hasToDate = typeof value.toDate === 'function'
    const hasSeconds = typeof value.seconds === 'number' || typeof value._seconds === 'number'
    return `object<${ctor}>${hasToDate ? ' +toDate()' : ''}${hasSeconds ? ' +seconds' : ''}`
  }
  return typeof value
}

/** Same resolution order as shared/utils/dates.ts — kept in sync deliberately. */
function toDate(value) {
  if (value === null || value === undefined) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }
  if (typeof value !== 'object') return null
  if (typeof value.toDate === 'function') {
    const converted = value.toDate()
    return converted instanceof Date && !Number.isNaN(converted.getTime()) ? converted : null
  }
  const seconds = value.seconds ?? value._seconds
  if (typeof seconds === 'number') {
    const parsed = new Date(seconds * 1000)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }
  return null
}

/** What the pre-#364 code did — kept to show the bug is really gone. */
function legacyReadable(value) {
  return !Number.isNaN(new Date(value).getTime())
}

// ---------- load ----------
const [dashSnap, userSnap, groupSnap, folderSnap] = await Promise.all([
  db.collection('dashboards').get(),
  db.collection('users').get(),
  db.collection('groups').get(),
  db.collection('folders').get(),
])

const dashboards = dashSnap.docs.map(d => ({ _id: d.id, ...d.data() }))
const users = userSnap.docs.map(d => ({ _id: d.id, ...d.data() }))
const groups = groupSnap.docs.map(d => ({ _id: d.id, ...d.data() }))
const folders = folderSnap.docs.map(d => ({ _id: d.id, ...d.data() }))
const userByUid = new Map(users.map(u => [u._id, u]))

const now = new Date()
const targetId = process.argv.slice(2).find(a => !a.startsWith('--'))

// ---------- expiry report ----------
console.log(`\n=== restrictions.expiry shapes (now = ${now.toISOString()}) ===`)
let found = 0
for (const d of dashboards) {
  if (targetId && d._id !== targetId) continue
  const expiry = d.restrictions?.expiry ?? {}
  const entries = Object.entries(expiry)
  if (entries.length === 0) continue
  found += entries.length
  console.log(`\ndashboard ${d._id}  "${d.name ?? d.title ?? ''}"`)
  for (const [uid, value] of entries) {
    const resolved = toDate(value)
    const email = userByUid.get(uid)?.email ?? '(unknown uid)'
    console.log(
      `  ${uid} (${email})\n` +
      `    shape:    ${describeShape(value)}\n` +
      `    resolves: ${resolved ? resolved.toISOString() : 'null (treated as NOT expired, by design)'}\n` +
      `    expired:  ${resolved !== null && resolved.getTime() < now.getTime()}\n` +
      `    legacy new Date() readable: ${legacyReadable(value)}`,
    )
  }
}
if (found === 0) console.log(targetId ? '  (no expiry entries on that dashboard)' : '  (no expiry entries anywhere)')

// ---------- full detail for one dashboard ----------
if (targetId) {
  const d = dashboards.find(x => x._id === targetId)
  if (!d) {
    console.error(`\n❌ dashboard ${targetId} not found`)
    process.exit(1)
  }
  console.log(`\n=== dashboards/${targetId} access + restrictions (verbatim) ===`)
  console.log(JSON.stringify({ access: d.access ?? null, restrictions: d.restrictions ?? null }, null, 2))
  const uids = d.access?.direct?.users ?? []
  if (uids.length) {
    console.log('\ndirect users:')
    for (const uid of uids) {
      const u = userByUid.get(uid)
      console.log(`  ${uid}  ${u ? `${u.email} role=${u.role} company=${u.company}` : '(orphan uid)'}`)
    }
  }
  // Folder inheritance matters: access OR-merges up the folder chain, and a
  // moderator assigned to any ancestor gets in without an explicit grant.
  console.log('\nfolder chain (inherited access + assigned moderators):')
  let cur = d.folderId ?? null
  if (!cur) console.log('  (dashboard is not in a folder)')
  while (cur) {
    const f = folders.find(x => x._id === cur)
    if (!f) { console.log(`  ${cur} — ORPHAN (folder missing)`); break }
    console.log(`  ${f._id} "${f.name ?? ''}" access=${JSON.stringify(f.access ?? null)} moderators=[${(f.assignedModerators ?? []).join(',')}]`)
    cur = f.parentId || null
  }
  process.exit(0)
}

// ---------- candidates for the end-to-end test ----------
console.log('\n=== dashboard candidates (fewest people reachable = safest to touch) ===')
const memberCountOfGroup = new Map(groups.map(g => [g._id, (g.members ?? []).length]))
const rows = dashboards.map(d => {
  const a = d.access ?? {}
  const direct = a.direct?.users?.length ?? 0
  const viaGroups = (a.direct?.groups ?? []).reduce((n, g) => n + (memberCountOfGroup.get(g) ?? 0), 0)
  const companies = a.company?.length ?? 0
  const companyUsers = users.filter(u => (a.company ?? []).includes(u.company)).length
  const reach = a.public === true ? users.length : direct + viaGroups + companyUsers
  return { id: d._id, name: d.name ?? d.title ?? '', public: a.public === true, direct, groups: a.direct?.groups?.length ?? 0, companies, reach, folderId: d.folderId ?? null }
})
rows.sort((x, y) => x.reach - y.reach)
for (const r of (process.argv.includes('--all') ? rows : rows.slice(0, 12))) {
  console.log(`  reach=${String(r.reach).padStart(3)}  public=${r.public}  direct=${r.direct} groups=${r.groups} companies=${r.companies}  ${r.id}  "${r.name}"`)
}

console.log('\n=== users (a test user must currently have NO access to the test dashboard) ===')
for (const u of users) {
  console.log(`  ${u._id}  ${u.email ?? '(no email)'}  role=${u.role} company=${u.company} groups=[${(u.groups ?? []).join(',')}]`)
}
