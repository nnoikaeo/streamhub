/**
 * Regression test: routeRules must NOT contain complex header objects,
 * and the experimental app manifest must be disabled.
 *
 * Bug 1 (headers): Nuxt's client-side route-rule matcher in Firebase preset +
 * SPA mode tries to call `.entries()` on serialised header objects, but the
 * value is `undefined` in the client bundle.
 *
 * Bug 2 (appManifest): In Firebase's Nitro preset the Cloud Function and
 * Hosting are deployed as separate artefacts. When the buildId baked into
 * the SPA HTML (from the Cloud Function) doesn't match the manifest JSON
 * files on Hosting, the client fetches HTML instead of JSON and crashes with:
 *   "Cannot read properties of undefined (reading 'entries')"
 *   "Cannot read properties of undefined (reading 'includes')"
 * Disabling `experimental.appManifest` eliminates this entire code path.
 *
 * Fix: Security headers → server/middleware/securityHeaders.ts.
 *       App manifest → disabled via experimental.appManifest: false.
 *
 * @see nuxt.config.ts — routeRules, experimental
 * @see server/middleware/securityHeaders.ts
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const ROOT = process.cwd()

// ── nuxt.config.ts source checks ──────────────────────────────────────────
const nuxtConfigPath = resolve(ROOT, 'nuxt.config.ts')
const nuxtConfig = readFileSync(nuxtConfigPath, 'utf8')

describe('nuxt.config.ts — routeRules (regression: entries error)', () => {
  it('does NOT contain headers inside routeRules', () => {
    // If headers appear inside routeRules, the Firebase SPA build will crash
    // at runtime with "Cannot read properties of undefined (reading 'entries')"
    const routeRulesMatch = nuxtConfig.match(/routeRules\s*:\s*\{([\s\S]*?)\n\s*\},/)
    expect(routeRulesMatch).not.toBeNull()

    const routeRulesBlock = routeRulesMatch![1]
    expect(routeRulesBlock).not.toContain('headers:')
  })

  it('does NOT declare redundant ssr:false per-route (already global)', () => {
    const routeRulesMatch = nuxtConfig.match(/routeRules\s*:\s*\{([\s\S]*?)\n\s*\},/)
    const routeRulesBlock = routeRulesMatch![1]
    expect(routeRulesBlock).not.toContain('ssr: false')
    expect(routeRulesBlock).not.toContain('ssr:false')
  })
})

// ── App manifest must be disabled (regression: buildId mismatch) ──────────
describe('nuxt.config.ts — experimental.appManifest (regression: entries/includes error)', () => {
  it('disables appManifest to prevent buildId mismatch on Firebase', () => {
    // The experimental block must exist and contain appManifest: false
    expect(nuxtConfig).toContain('appManifest: false')
  })

  it('has the experimental block in nuxt config', () => {
    expect(nuxtConfig).toMatch(/experimental\s*:\s*\{/)
  })
})

// ── Security headers middleware checks ─────────────────────────────────────
const middlewarePath = resolve(ROOT, 'server/middleware/securityHeaders.ts')

describe('server/middleware/securityHeaders.ts (regression: entries error)', () => {
  it('exists', () => {
    expect(existsSync(middlewarePath)).toBe(true)
  })

  it('sets Content-Security-Policy header', () => {
    const source = readFileSync(middlewarePath, 'utf8')
    expect(source).toContain('Content-Security-Policy')
  })

  it('sets X-Frame-Options header', () => {
    const source = readFileSync(middlewarePath, 'utf8')
    expect(source).toContain('X-Frame-Options')
  })

  it('sets no-store Cache-Control for /api/mock/', () => {
    const source = readFileSync(middlewarePath, 'utf8')
    expect(source).toContain('no-store')
    expect(source).toContain('/api/mock/')
  })
})
