#!/usr/bin/env node
/**
 * Read-only check that the Firestore rules Google is enforcing are the ones in
 * this repository.
 *
 * CI cannot deploy rules — the service account lacks `firebaserules.googleapis.com`
 * — so `firestore.rules` is deployed by hand, and nothing until now could tell you
 * whether that had actually happened. A rules file that is edited, reviewed and
 * merged but never deployed looks exactly like one that is live.
 *
 * Fetches the active `cloud.firestore` release, compares its source against the
 * local file, and exits 1 when they differ.
 *
 * Auth: GOOGLE_SERVICE_ACCOUNT_KEY (or GOOGLE_APPLICATION_CREDENTIALS) from
 * .env.local — the same credentials audit-orphans.mjs uses. Never writes.
 *
 * Run:  npm run rules:verify
 *       npm run rules:verify -- --print   # also dump the live source
 *
 * Deploy them with:
 *   firebase deploy --only firestore:rules --project streamhub-1c27a
 */
import { google } from 'googleapis'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
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

const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
if (!rawKey && !keyPath) {
  console.error('❌ No credentials. Set GOOGLE_SERVICE_ACCOUNT_KEY or GOOGLE_APPLICATION_CREDENTIALS in .env.local')
  process.exit(1)
}

const credentials = rawKey ? JSON.parse(rawKey) : JSON.parse(readFileSync(keyPath, 'utf-8'))
const projectId = credentials.project_id

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/cloud-platform'],
})
const api = google.firebaserules({ version: 'v1', auth })

const { data: list } = await api.projects.releases.list({ name: `projects/${projectId}` })
const release = (list.releases || []).find((r) => r.name.endsWith('cloud.firestore'))
if (!release) {
  console.error(`❌ No cloud.firestore release on ${projectId} — rules have never been deployed.`)
  process.exit(1)
}

const { data: ruleset } = await api.projects.rulesets.get({ name: release.rulesetName })
const live = (ruleset.source.files || []).map((f) => f.content).join('\n')
const repo = readFileSync(resolve(ROOT_DIR, 'firestore.rules'), 'utf-8')

/** Trailing whitespace and line endings are not rule semantics. */
const normalise = (s) => s.replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '').trim()
const digest = (s) => createHash('sha256').update(normalise(s)).digest('hex').slice(0, 12)

const same = normalise(live) === normalise(repo)

console.log(`project  : ${projectId}`)
console.log(`ruleset  : ${ruleset.name.split('/').pop()}`)
console.log(`deployed : ${ruleset.createTime}`)
console.log(`live     : ${digest(live)}  (${normalise(live).split('\n').length} lines)`)
console.log(`repo     : ${digest(repo)}  (${normalise(repo).split('\n').length} lines)`)

if (process.argv.includes('--print')) console.log(`\n--- live source ---\n${live}`)

if (same) {
  console.log('\n✅ Deployed rules match firestore.rules')
  process.exit(0)
}

console.log('\n❌ Deployed rules DIFFER from firestore.rules')
const a = normalise(live).split('\n')
const b = normalise(repo).split('\n')
for (let i = 0; i < Math.max(a.length, b.length); i++) {
  if (a[i] !== b[i]) {
    console.log(`first difference at line ${i + 1}:`)
    console.log(`  live: ${a[i] ?? '(end of file)'}`)
    console.log(`  repo: ${b[i] ?? '(end of file)'}`)
    break
  }
}
console.log('\nDeploy with: firebase deploy --only firestore:rules --project ' + projectId)
process.exit(1)
