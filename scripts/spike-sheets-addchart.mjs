/**
 * SPIKE — add one chart to the SPIKE-D-large fixture.
 *
 * S2.5 needs a sheet that has a chart on it, so we can tell "the API does not
 * return charts" apart from "there was no chart to return". Doing it through
 * the API rather than by hand also answers a second question for free: what a
 * write costs, since the service account is a reader everywhere else.
 *
 * WRITES. Dry run unless `--apply`, same as the other fixture scripts.
 *
 * Requires, and this is the whole point of the exercise:
 *   1. scope `spreadsheets` (write), not `spreadsheets.readonly`
 *   2. the service account to be an EDITOR on the file, not a reader
 * Put the sharing back to reader afterwards — every other S2 result assumes it.
 *
 * Run:  node scripts/spike-sheets-addchart.mjs [--apply]
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

const SPREADSHEET_ID = '1gDsTbRfnmO-CkBrenlxSGFbNnfv2rEfQ5-ZQF8_ggWk'
const apply = process.argv.includes('--apply')

const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
if (!key) {
  console.error('❌ GOOGLE_SERVICE_ACCOUNT_KEY missing from .env.local')
  process.exit(1)
}

const credentials = JSON.parse(key)
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
})
const sheets = google.sheets({ version: 'v4', auth })

console.log(`\nservice account: ${credentials.client_email}`)
console.log(`spreadsheet: ${SPREADSHEET_ID}`)

const meta = await sheets.spreadsheets.get({
  spreadsheetId: SPREADSHEET_ID,
  fields: 'sheets(properties(sheetId,title),charts(chartId))',
})
const sheet0 = meta.data.sheets[0]
const sheetId = sheet0.properties.sheetId
const existing = sheet0.charts?.length || 0

console.log(`tab "${sheet0.properties.title}" (sheetId ${sheetId}) · charts now: ${existing}`)

if (existing > 0) {
  console.log('\nA chart is already there. Nothing to do — rerun the read spike instead.\n')
  process.exit(0)
}

// Column chart: store_code (col A) against machines (col I), first 20 rows.
// Small on purpose — the point is that a chart exists, not what it shows.
const request = {
  addChart: {
    chart: {
      spec: {
        title: 'Machines per store (first 20)',
        basicChart: {
          chartType: 'COLUMN',
          legendPosition: 'BOTTOM_LEGEND',
          domains: [{
            domain: { sourceRange: { sources: [{ sheetId, startRowIndex: 0, endRowIndex: 21, startColumnIndex: 0, endColumnIndex: 1 }] } },
          }],
          series: [{
            series: { sourceRange: { sources: [{ sheetId, startRowIndex: 0, endRowIndex: 21, startColumnIndex: 8, endColumnIndex: 9 }] } },
            targetAxis: 'LEFT_AXIS',
          }],
          headerCount: 1,
        },
      },
      position: {
        overlayPosition: {
          anchorCell: { sheetId, rowIndex: 1, columnIndex: 17 },
          widthPixels: 600,
          heightPixels: 350,
        },
      },
    },
  },
}

if (!apply) {
  console.log('\nDRY RUN — would add one COLUMN chart anchored at R2. Pass --apply to write.\n')
  process.exit(0)
}

const t0 = Date.now()
try {
  const res = await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: { requests: [request] },
  })
  const chartId = res.data.replies[0].addChart.chart.chartId
  console.log(`\n✅ chart added in ${Date.now() - t0} ms · chartId ${chartId}`)
  console.log('Now set the service account back to reader on this file.\n')
} catch (error) {
  const status = error?.status || error?.code || '?'
  const message = error?.errors?.[0]?.message || error?.message || String(error)
  console.error(`\n❌ ${status} — ${message}`)
  if (String(status) === '403') {
    console.error('The service account is probably still a reader on this file. Make it an editor, rerun, then set it back.\n')
  }
  process.exit(1)
}
