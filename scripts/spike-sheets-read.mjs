/**
 * SPIKE — read a Google Sheet through the Firebase service account.
 *
 * Answers S2.1/S2.2/S2.3/S2.5/S2.6 of docs/OPERATIONS/google-sheets-spike-plan.md:
 * can a sheet that is merely *shared with* the service account be read from the
 * server, how long does a large one take, and does the grid-data call carry the
 * formatting an iframe would have shown.
 *
 * READ-ONLY. Lives on `feat/google-sheets-spike` only — not part of the app.
 *
 * Auth: GOOGLE_SERVICE_ACCOUNT_KEY from .env.local, the same key the other
 * scripts use, with the Sheets read scope added on top.
 *
 * Run:  node scripts/spike-sheets-read.mjs A|B|C|D|<spreadsheetId> [--grid] [--csv]
 */
import { google } from 'googleapis'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..')

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

/** The SPIKE-0 fixtures. See the plan for what each one is for. */
const SHEETS = {
  A: { id: '11YaVVepT-NyPfzQgQ09LBV6hJ0oOIBwem7Sfq-KsJD4', note: 'private — must FAIL' },
  B: { id: '101LffW_2dOTvU57SeZKrXExlBmkf0-1Dk6W6LxfkUKI', note: 'shared with the service account' },
  C: { id: '1hey_rTzYyYIhX1SPz0Rbu_W0luo2yHhV6obXClFWBe4', note: 'published to web, NOT shared with the SA' },
  D: { id: '1gDsTbRfnmO-CkBrenlxSGFbNnfv2rEfQ5-ZQF8_ggWk', note: 'shared with the SA, 3,300 rows' },
}

const [target, ...flags] = process.argv.slice(2)
if (!target) {
  console.error('Usage: node scripts/spike-sheets-read.mjs A|B|C|D|<spreadsheetId> [--grid] [--csv]')
  process.exit(1)
}

const entry = SHEETS[target]
const spreadsheetId = entry ? entry.id : target
const wantGrid = flags.includes('--grid')
const wantCsv = flags.includes('--csv')

const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
if (!key) {
  console.error('❌ GOOGLE_SERVICE_ACCOUNT_KEY missing from .env.local')
  process.exit(1)
}

const credentials = JSON.parse(key)
// `/export?format=csv` is a Drive endpoint, not a Sheets one — the Sheets
// scope alone answers it with a 401 login page. `--drive` adds the Drive read
// scope to find out whether that is the whole story (S2.6).
const scopes = ['https://www.googleapis.com/auth/spreadsheets.readonly']
if (flags.includes('--drive')) scopes.push('https://www.googleapis.com/auth/drive.readonly')

const auth = new google.auth.GoogleAuth({ credentials, scopes })
const sheets = google.sheets({ version: 'v4', auth })

const kb = (obj) => `${(Buffer.byteLength(JSON.stringify(obj)) / 1024).toFixed(1)} KB`
const fail = (label, error) => {
  const status = error?.status || error?.code || '?'
  const message = error?.errors?.[0]?.message || error?.message || String(error)
  console.log(`  ${label}: ❌ ${status} — ${message}`)
  return null
}

console.log(`\nservice account: ${credentials.client_email}`)
console.log(`sheet ${entry ? target : '(raw id)'}: ${spreadsheetId}${entry ? `  — ${entry.note}` : ''}\n`)

// --- metadata: the cheapest call, and the one that says whether we have access
let meta = null
{
  const t0 = Date.now()
  try {
    const res = await sheets.spreadsheets.get({ spreadsheetId, includeGridData: false })
    meta = res.data
    const tabs = meta.sheets.map(s => `${s.properties.title} (${s.properties.gridProperties.rowCount}×${s.properties.gridProperties.columnCount})`)
    console.log(`  metadata: ✅ ${Date.now() - t0} ms — "${meta.properties.title}" · tabs: ${tabs.join(', ')}`)
  } catch (error) {
    fail('metadata', error)
  }
}

// --- values: what a proxy renderer would actually serve
if (meta) {
  const tab = meta.sheets[0].properties.title
  const t0 = Date.now()
  try {
    const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: tab })
    const rows = res.data.values || []
    console.log(`  values.get: ✅ ${Date.now() - t0} ms — ${rows.length} rows × ${rows[0]?.length || 0} cols · ${kb(res.data)}`)
  } catch (error) {
    fail('values.get', error)
  }
}

// --- grid data: cell formatting, charts, merges — how close option 2 can get to the native UI
if (meta && wantGrid) {
  const t0 = Date.now()
  try {
    const res = await sheets.spreadsheets.get({ spreadsheetId, includeGridData: true })
    const sheet0 = res.data.sheets[0]
    const charts = sheet0.charts?.length || 0
    const conditional = sheet0.conditionalFormats?.length || 0
    const frozen = sheet0.properties.gridProperties.frozenRowCount || 0
    console.log(`  grid data: ✅ ${Date.now() - t0} ms — ${kb(res.data)} · charts ${charts} · conditional formats ${conditional} · frozen rows ${frozen}`)
  } catch (error) {
    fail('grid data', error)
  }
}

// --- grid data, trimmed: the 31 MB full grid is unusable, so measure what a
// field mask costs when it asks only for the structure a renderer needs
// (frozen rows, conditional-format rules, charts, merges) and no cell payload.
if (meta && flags.includes('--grid-lite')) {
  const t0 = Date.now()
  try {
    const res = await sheets.spreadsheets.get({
      spreadsheetId,
      includeGridData: false,
      fields: 'sheets(properties(title,gridProperties),conditionalFormats,charts,merges)',
    })
    const sheet0 = res.data.sheets[0]
    console.log(`  grid lite: ✅ ${Date.now() - t0} ms — ${kb(res.data)} · charts ${sheet0.charts?.length || 0} · conditional formats ${sheet0.conditionalFormats?.length || 0} · merges ${sheet0.merges?.length || 0}`)
  } catch (error) {
    fail('grid lite', error)
  }
}

// --- CSV export with the SA's own bearer token: the cheap path, if it works at all
if (meta && wantCsv) {
  const t0 = Date.now()
  try {
    const client = await auth.getClient()
    const { token } = await client.getAccessToken()
    const gid = meta.sheets[0].properties.sheetId
    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    const body = await res.text()
    const ok = res.ok && !body.startsWith('<')
    console.log(`  csv export: ${ok ? '✅' : '❌'} ${res.status} ${Date.now() - t0} ms — ${(body.length / 1024).toFixed(1)} KB · first line: ${body.split('\n')[0].slice(0, 60)}`)
  } catch (error) {
    fail('csv export', error)
  }
}

// --- burst: 20 reads at once, to see whether the per-project read quota is a
// real ceiling for a proxy that serves one API call per page view (S2.4).
if (meta && flags.includes('--burst')) {
  const tab = meta.sheets[0].properties.title
  const t0 = Date.now()
  const results = await Promise.allSettled(
    Array.from({ length: 20 }, () => sheets.spreadsheets.values.get({ spreadsheetId, range: tab }))
  )
  const ok = results.filter(r => r.status === 'fulfilled').length
  const errs = [...new Set(results.filter(r => r.status === 'rejected')
    .map(r => `${r.reason?.status || r.reason?.code}: ${String(r.reason?.message).slice(0, 80)}`))]
  console.log(`  burst: ${ok === 20 ? '✅' : '⚠️'} ${ok}/20 ok in ${Date.now() - t0} ms${errs.length ? ` · ${errs.join(' | ')}` : ''}`)
}

console.log('')
