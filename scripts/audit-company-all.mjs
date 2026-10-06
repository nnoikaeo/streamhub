/**
 * audit-company-all.mjs — READ-ONLY: which dashboards and folders grant
 * "ทุกบริษัท" (`access.company` containing `ALL`). [BUG-043]
 *
 * The permission editor stores `ALL` and the page counts it as everyone in an
 * active company, but neither access check matches it
 * (`server/utils/companyAccess.ts` matchesAccessRules,
 * `useFirestoreService.checkAccess`) — so today it grants nobody. Before
 * deciding whether to make the checks honour it (which would open every item
 * listed here at once) or to remove the option, this lists what is affected.
 *
 * For each item it prints what else grants access, so "nobody can open this
 * except admins" stands out from "ALL is redundant next to other grants".
 * A folder with ALL only matters to dashboards when `inheritPermissions` is on;
 * those dashboards are listed under it.
 *
 * Reads `dashboards` and `folders` only — no user records, no names or emails.
 *
 * Usage:  node scripts/audit-company-all.mjs
 * Exit:   0 always (an audit, not a gate)
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

const ALL = 'ALL'

const getAll = async (name) => (await db.collection(name).get()).docs.map(d => ({ id: d.id, ...d.data() }))
const [dashboards, folders] = await Promise.all([getAll('dashboards'), getAll('folders')])
const folderById = new Map(folders.map(f => [f.id, f]))

const hasAll = (access) => Array.isArray(access?.company) && access.company.includes(ALL)

/** Everything besides ALL that grants access — counts and codes only. */
function otherGrants(access) {
  const parts = []
  if (access?.public === true) parts.push('🌐 public')
  const users = access?.direct?.users?.length ?? 0
  const groups = access?.direct?.groups?.length ?? 0
  const companies = (access?.company ?? []).filter(c => c !== ALL)
  if (users) parts.push(`${users} user(s)`)
  if (groups) parts.push(`${groups} group(s)`)
  if (companies.length) parts.push(`company ${companies.join(', ')}`)
  return parts.length ? parts.join(' + ') : '— nothing else (only admins and folder moderators can open it)'
}

function folderPath(folderId) {
  const names = []
  let id = folderId
  while (id) {
    const f = folderById.get(id)
    if (!f) { names.unshift(`<missing ${id}>`); break }
    names.unshift(f.name ?? f.id)
    id = f.parentId ?? null
  }
  return names.join(' / ') || '(no folder)'
}

/** Dashboards that sit under `folderId`, at any depth. */
function dashboardsUnder(folderId) {
  return dashboards.filter((d) => {
    let id = d.folderId
    while (id) {
      if (id === folderId) return true
      id = folderById.get(id)?.parentId ?? null
    }
    return false
  })
}

const dashHits = dashboards.filter(d => hasAll(d.access))
const folderHits = folders.filter(f => hasAll(f.access))

console.log(`\n📊 dashboards=${dashboards.length} folders=${folders.length}\n`)

console.log(`── Dashboards granting ทุกบริษัท (ALL): ${dashHits.length}`)
for (const d of dashHits) {
  console.log(`  • ${d.id}  "${d.name}"${d.isArchived ? '  [archived]' : ''}`)
  console.log(`      folder: ${folderPath(d.folderId)}`)
  console.log(`      other grants: ${otherGrants(d.access)}`)
}

console.log(`\n── Folders granting ทุกบริษัท (ALL): ${folderHits.length}`)
for (const f of folderHits) {
  const inherits = f.inheritPermissions === true
  console.log(`  • ${f.id}  "${f.name}"  path: ${folderPath(f.id)}`)
  console.log(`      inheritPermissions: ${inherits ? 'ON — reaches the dashboards below' : 'off — has no effect on any dashboard'}`)
  console.log(`      other grants: ${otherGrants(f.access)}`)
  if (inherits) {
    for (const d of dashboardsUnder(f.id)) {
      console.log(`        ↳ ${d.id}  "${d.name}"${d.isArchived ? '  [archived]' : ''}  own grants: ${otherGrants(d.access)}`)
    }
  }
}

const total = dashHits.length + folderHits.length
console.log(total === 0
  ? '\n✅ Nothing uses ทุกบริษัท — removing the option changes no one\'s access.\n'
  : `\n⚠️  ${total} item(s) use ทุกบริษัท. Each needs a decision: 🌐 public, a real company list, or remove.\n`)
