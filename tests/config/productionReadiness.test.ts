/**
 * Production Readiness Tests
 *
 * Static config assertions that verify the codebase is correctly configured
 * for production deployment. Uses readFileSync + string/regex assertions —
 * no mocks, no dynamic imports.
 *
 * These tests catch regressions such as:
 * - firebase.json missing critical env vars or pointing to localhost
 * - Auth middleware dev bypass leaking into production path
 * - CI workflow building with wrong feature flags
 * - .env missing dev-only documentation comments
 *
 * @see firebase.json — Cloud Function environment variables
 * @see server/middleware/auth.ts — production auth path
 * @see .github/workflows/deploy.yml — CI build environment
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const ROOT = process.cwd()

// ── 1. firebase.json — environment variables ──────────────────────────────

const firebaseJsonPath = resolve(ROOT, 'firebase.json')
const firebaseJson = JSON.parse(readFileSync(firebaseJsonPath, 'utf8'))
const envVars = firebaseJson.functions[0].environmentVariables as Record<string, string>

describe('firebase.json — environment variables', () => {
  it('sets NUXT_PUBLIC_USE_FIRESTORE to "true"', () => {
    expect(envVars.NUXT_PUBLIC_USE_FIRESTORE).toBe('true')
  })

  it('sets NUXT_PUBLIC_USE_JSON_MOCK to "false"', () => {
    expect(envVars.NUXT_PUBLIC_USE_JSON_MOCK).toBe('false')
  })

  it('sets NUXT_APP_URL without localhost', () => {
    expect(envVars.NUXT_APP_URL).toBeDefined()
    expect(envVars.NUXT_APP_URL).not.toContain('localhost')
  })

  it('sets NUXT_APP_URL starting with https://', () => {
    expect(envVars.NUXT_APP_URL).toMatch(/^https:\/\//)
  })
})

// ── 2. server/middleware/auth.ts — production path security ───────────────

const authMiddlewarePath = resolve(ROOT, 'server/middleware/auth.ts')
const authSource = readFileSync(authMiddlewarePath, 'utf8')

describe('server/middleware/auth.ts — production path security', () => {
  it('contains uid query param fallback for dev mode', () => {
    // The dev fallback must exist (for local development)
    expect(authSource).toContain('devMode: true')
  })

  it('uid fallback is only inside if (process.dev) block', () => {
    // Split source at the first `if (process.dev)` occurrence.
    // Everything BEFORE that line must NOT contain devMode.
    const processDevIndex = authSource.indexOf('if (process.dev)')
    expect(processDevIndex).toBeGreaterThan(-1)

    const beforeProcessDev = authSource.slice(0, processDevIndex)
    expect(beforeProcessDev).not.toContain('devMode')
  })

  it('production path uses sendUnauthorized', () => {
    // The section after "// ─── PRODUCTION" must contain sendUnauthorized
    const productionIndex = authSource.indexOf('PRODUCTION')
    expect(productionIndex).toBeGreaterThan(-1)

    const productionPath = authSource.slice(productionIndex)
    expect(productionPath).toContain('sendUnauthorized')
  })

  it('does not use console.log (only console.debug allowed)', () => {
    // console.log would appear in production Cloud Function logs.
    // Only console.debug is allowed (stripped in production builds).
    expect(authSource).not.toMatch(/console\.log\s*\(/)
  })
})

// ── 3. .github/workflows/deploy.yml — build environment ──────────────────

const deployYmlPath = resolve(ROOT, '.github/workflows/deploy.yml')
const deployYml = readFileSync(deployYmlPath, 'utf8')

describe('.github/workflows/deploy.yml — build environment', () => {
  it('sets NUXT_PUBLIC_USE_FIRESTORE to true during build', () => {
    expect(deployYml).toMatch(/NUXT_PUBLIC_USE_FIRESTORE:\s*['"]?true['"]?/)
  })

  it('sets NUXT_PUBLIC_USE_JSON_MOCK to false during build', () => {
    expect(deployYml).toMatch(/NUXT_PUBLIC_USE_JSON_MOCK:\s*['"]?false['"]?/)
  })
})

// ── 4. .env — dev-only documentation ─────────────────────────────────────
// .env is not committed (in .gitignore) — skip on CI where it doesn't exist.

const envPath = resolve(ROOT, '.env')
const hasEnvFile = existsSync(envPath)

describe.skipIf(!hasEnvFile)('.env — dev-only documentation', () => {
  it('has comments clarifying APP_URL / NUXT_APP_URL are dev-only defaults', () => {
    const envSource = readFileSync(envPath, 'utf8')
    // Ensure there is a comment near APP_URL or NUXT_APP_URL mentioning
    // dev/local/development to prevent confusion with production URLs.
    // Check that at least one comment line before APP_URL or NUXT_APP_URL
    // mentions "dev" or "local" or "development".
    const lines = envSource.split('\n')
    const commentBeforeAppUrl = lines.some((line, i) => {
      const isAppUrlLine = /^(NUXT_)?APP_URL=/.test(lines[i + 1] ?? '')
      const isDevComment = /^#.*\b(dev|local|development)\b/i.test(line)
      return isAppUrlLine && isDevComment
    })
    expect(commentBeforeAppUrl).toBe(true)
  })

  it('does not contain real Resend API keys', () => {
    const envSource = readFileSync(envPath, 'utf8')
    // Real Resend keys start with re_ followed by 20+ alphanumeric chars
    // Test/placeholder keys use "xxxx" patterns
    const realKeyPattern = /RESEND_API_KEY=re_(?!test_)[A-Za-z0-9]{20,}/
    expect(envSource).not.toMatch(realKeyPattern)
  })
})

// ── 5. server/middleware/blockMockApi.ts — mock API blocked in production ─

const blockMockPath = resolve(ROOT, 'server/middleware/blockMockApi.ts')

describe('server/middleware/blockMockApi.ts — mock API blocked in production', () => {
  it('exists as a server middleware', () => {
    expect(existsSync(blockMockPath)).toBe(true)
  })

  it('blocks /api/mock/ routes in production', () => {
    const blockMockSource = readFileSync(blockMockPath, 'utf8')
    expect(blockMockSource).toContain('/api/mock/')
    expect(blockMockSource).toContain('statusCode: 404')
  })
})
