/**
 * Cloud Build status for the Firebase Functions deploys.
 *
 * READ-ONLY — lists builds and their timings so a CI deploy failure can be
 * classified without opening the GCP console:
 *
 *   • queue ≈ 600s + run 0s + status EXPIRED
 *       → the build never got a worker. Google-side capacity in the region,
 *         not our code. Rerun the GitHub job; nothing to fix in the repo.
 *   • status FAILURE (or TIMEOUT) with a non-zero run time
 *       → a real build failure. Open the logUrl printed for that build.
 *
 * A healthy deploy in this project queues for ~1s and runs for ~40s.
 *
 * Auth: reads GOOGLE_SERVICE_ACCOUNT_KEY (or GOOGLE_APPLICATION_CREDENTIALS)
 * from .env.local — the same admin credentials as scripts/audit-orphans.mjs.
 * Uses firebase-admin's own credential to mint the token, so no extra
 * dependency and no gcloud install.
 *
 * Run:  npm run cloudbuild:status                 # last 15 builds
 *       npm run cloudbuild:status -- --limit 30
 *       npm run cloudbuild:status -- <buildId>    # details for one build
 */
import { cert, applicationDefault } from 'firebase-admin/app'
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

// ── Args ────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const readOpt = (name, fallback) => {
  const i = args.indexOf(name)
  return i === -1 ? fallback : args[i + 1]
}
const REGION = readOpt('--region', 'us-central1')
const LIMIT = Number(readOpt('--limit', '15'))
const BUILD_IDS = args.filter(a => !a.startsWith('--') && a !== String(LIMIT) && a !== REGION)

// ── Auth ────────────────────────────────────────────────────────────────────
const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
if (!key && !keyPath) {
  console.error('❌ No credentials. Set GOOGLE_SERVICE_ACCOUNT_KEY or GOOGLE_APPLICATION_CREDENTIALS in .env.local')
  process.exit(1)
}

const parsed = key ? JSON.parse(key) : JSON.parse(readFileSync(keyPath, 'utf-8'))
const credential = key ? cert(parsed) : applicationDefault()
const projectId = parsed.project_id
const { access_token: token } = await credential.getAccessToken()

const api = async (path) => {
  const res = await fetch(`https://cloudbuild.googleapis.com/v1/projects/${projectId}/locations/${REGION}/${path}`,
    { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) {
    console.error(`❌ Cloud Build API ${res.status}: ${(await res.text()).slice(0, 300)}`)
    process.exit(1)
  }
  return res.json()
}

const secondsBetween = (a, b) => (a && b ? Math.round((new Date(b) - new Date(a)) / 1000) : null)

// ── Detail view for specific build ids ──────────────────────────────────────
if (BUILD_IDS.length > 0) {
  for (const id of BUILD_IDS) {
    const b = await api(`builds/${id}`)
    const queue = secondsBetween(b.createTime, b.startTime)
    const run = secondsBetween(b.startTime, b.finishTime)
    console.log(`\n=== build ${id} (${REGION}) ===`)
    console.log(`status      : ${b.status}`)
    console.log(`statusDetail: ${b.statusDetail ?? '—'}`)
    console.log(`failureInfo : ${b.failureInfo ? JSON.stringify(b.failureInfo) : '—'}`)
    console.log(`createTime  : ${b.createTime}`)
    console.log(`startTime   : ${b.startTime ?? '(never started)'}`)
    console.log(`finishTime  : ${b.finishTime ?? '—'}`)
    console.log(`queued      : ${queue ?? '—'}s   (queueTtl ${b.queueTtl ?? '—'})`)
    console.log(`ran         : ${run ?? '—'}s   (timeout ${b.timeout ?? '—'})`)
    console.log(`logUrl      : ${b.logUrl}`)
    if (b.status === 'EXPIRED' && !run) {
      console.log('\n→ never got a worker: queue expiry on Google\'s side, not a build error. Rerun the CI job.')
    }
  }
  process.exit(0)
}

// ── List view ───────────────────────────────────────────────────────────────
const { builds = [] } = await api(`builds?pageSize=${LIMIT}`)

console.log(`\n📦 Cloud Build — ${projectId} / ${REGION} — last ${builds.length} build(s), newest first\n`)
console.log('created            status     queued      ran')

const counts = {}
let expiredInQueue = 0
for (const b of builds) {
  counts[b.status] = (counts[b.status] ?? 0) + 1
  const queue = secondsBetween(b.createTime, b.startTime)
  const run = secondsBetween(b.startTime, b.finishTime)
  if (b.status === 'EXPIRED' && !run) expiredInQueue++
  const flag = b.status === 'SUCCESS' ? '' : '  ⟵'
  console.log(
    `${b.createTime.slice(0, 19).replace('T', ' ')}  ${String(b.status).padEnd(9)}  ` +
    `${String(queue ?? '—').padStart(5)}s  ${String(run ?? '—').padStart(5)}s${flag}`
  )
}

console.log(`\ntotals: ${JSON.stringify(counts)}`)
if (expiredInQueue > 0) {
  console.log(`\n⚠️  ${expiredInQueue} build(s) expired while queued (ran 0s) — Google-side capacity in ${REGION}.`)
  console.log('   Nothing to fix in the repo. Rerun the failed CI job, or wait and let the next push carry it.')
  console.log('   Compare: a healthy deploy here queues ~1s and runs ~40s.')
}
console.log('\n(read-only — no writes)\n')
