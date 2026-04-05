/**
 * Regression test: routeRules must NOT contain complex header objects.
 *
 * Bug: Nuxt's client-side route-rule matcher in Firebase preset + SPA mode
 * tries to call `.entries()` on serialised header objects, but the value is
 * `undefined` in the client bundle, throwing:
 *   "[nuxt] Error matching route rules. TypeError: Cannot read properties
 *    of undefined (reading 'entries')"
 *
 * Fix: Security headers are set in server/middleware/securityHeaders.ts.
 * Redundant `ssr: false` per-route rules (already global) are removed.
 *
 * @see nuxt.config.ts — routeRules
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
