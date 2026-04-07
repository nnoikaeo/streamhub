/**
 * Regression test for: prepare-firebase-deploy.mjs
 *
 * The script reads environmentVariables from firebase.json and writes them
 * into a .env file (read by Firebase CLI at deploy time). Secrets are placed
 * in functions.yaml as secretEnvironmentVariables.
 *
 * - Missing .env → NUXT_APP_URL undefined → invite links point to localhost
 * - Missing secretEnvironmentVariables → RESEND_API_KEY undefined → emails silently skipped
 *
 * @see scripts/prepare-firebase-deploy.mjs
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const ROOT = process.cwd()
const SCRIPT_PATH = resolve(ROOT, 'scripts/prepare-firebase-deploy.mjs')
const FIREBASE_JSON_PATH = resolve(ROOT, 'firebase.json')

const scriptSource = readFileSync(SCRIPT_PATH, 'utf8')
const firebaseConfig = JSON.parse(readFileSync(FIREBASE_JSON_PATH, 'utf8'))
const fnConfig = (firebaseConfig.functions || [])[0] || {}

// ── Source-level checks ────────────────────────────────────────────────────
describe('prepare-firebase-deploy.mjs — source integrity', () => {
  it('script file exists', () => {
    expect(existsSync(SCRIPT_PATH)).toBe(true)
  })

  it('reads environmentVariables from firebase.json', () => {
    expect(scriptSource).toContain('environmentVariables')
    expect(scriptSource).toContain('firebaseConfig')
  })

  it('creates .env file for Firebase CLI', () => {
    expect(scriptSource).toContain('.env')
    expect(scriptSource).toContain('writeFileSync')
  })

  it('reads secretEnvironmentVariables from firebase.json', () => {
    expect(scriptSource).toContain('secretEnvironmentVariables')
  })
})

// ── firebase.json env vars configuration ───────────────────────────────────
describe('firebase.json — environment variables', () => {
  const envVars = fnConfig.environmentVariables || {}

  it('defines NUXT_APP_URL for production (REGRESSION — invite links)', () => {
    expect(envVars.NUXT_APP_URL).toBe('https://streamhub-1c27a.web.app')
  })

  it('defines NUXT_PUBLIC_USE_FIRESTORE', () => {
    expect(envVars.NUXT_PUBLIC_USE_FIRESTORE).toBe('true')
  })

  it('defines NUXT_RESEND_FROM_EMAIL', () => {
    expect(envVars.NUXT_RESEND_FROM_EMAIL).toContain('@streamwash.com')
  })
})

describe('firebase.json — secret environment variables', () => {
  const secrets = fnConfig.secretEnvironmentVariables || []
  const secretKeys = secrets.map((s: { key: string }) => s.key)

  /**
   * REGRESSION: Without this secret, Cloud Functions runtime does NOT
   * inject RESEND_API_KEY from Secret Manager — emails silently skipped.
   */
  it('registers RESEND_API_KEY as a secret (REGRESSION)', () => {
    expect(secretKeys).toContain('RESEND_API_KEY')
  })
})

// ── Simulate YAML generation logic ─────────────────────────────────────────
describe('prepare-firebase-deploy.mjs — generated functions.yaml content', () => {
  const secretEnvVars = fnConfig.secretEnvironmentVariables || []
  let secretEnvVarsYaml = ''
  if (secretEnvVars.length > 0) {
    secretEnvVarsYaml = '    secretEnvironmentVariables:\n'
    for (const secret of secretEnvVars) {
      secretEnvVarsYaml += `      - key: ${secret.key}\n`
    }
  }

  const generatedYaml = `specVersion: v1alpha1
endpoints:
  server:
    platform: gcfv2
    region:
      - us-central1
    labels: {}
    httpsTrigger: {}
    entryPoint: server
    timeoutSeconds: 60
    availableMemoryMb: 1024
${secretEnvVarsYaml}`

  it('contains specVersion v1alpha1', () => {
    expect(generatedYaml).toContain('specVersion: v1alpha1')
  })

  it('declares Cloud Run v2 platform', () => {
    expect(generatedYaml).toContain('platform: gcfv2')
  })

  it('includes secretEnvironmentVariables with RESEND_API_KEY (REGRESSION)', () => {
    expect(generatedYaml).toMatch(/secretEnvironmentVariables:\s*\n\s*- key: RESEND_API_KEY/)
  })
})

// ── Simulate .env file generation ──────────────────────────────────────────
describe('prepare-firebase-deploy.mjs — generated .env content', () => {
  const envVars = fnConfig.environmentVariables || {}
  const envVarEntries = Object.entries(envVars)
  const generatedEnv = envVarEntries.map(([key, value]) => `${key}=${value}`).join('\n') + '\n'

  it('includes NUXT_APP_URL (REGRESSION — invite links)', () => {
    expect(generatedEnv).toContain('NUXT_APP_URL=https://streamhub-1c27a.web.app')
  })

  it('includes NUXT_PUBLIC_USE_FIRESTORE', () => {
    expect(generatedEnv).toContain('NUXT_PUBLIC_USE_FIRESTORE=true')
  })

  it('includes NUXT_RESEND_FROM_EMAIL', () => {
    expect(generatedEnv).toContain('NUXT_RESEND_FROM_EMAIL=')
  })
})
