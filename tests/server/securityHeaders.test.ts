/**
 * Guard for the Content-Security-Policy frame-src list (BUG-036).
 *
 * The CSP lives in two places: server/middleware/securityHeaders.ts for
 * responses the function serves, and a static copy in firebase.json for assets
 * Hosting serves itself. BUG-036 shipped because nothing compared them with
 * what sheet embeds need: without https://accounts.google.com, Google's
 * passive sign-in hop was blocked and every sheet on production Safari was a
 * blank frame — while lint, typecheck and this suite all passed.
 *
 * The middleware is run for real (defineEventHandler is stubbed to return the
 * handler) so the header asserted is the one it sends, not a string that
 * happens to appear somewhere in its source.
 *
 * @see server/middleware/securityHeaders.ts
 * @see firebase.json
 * @see docs/REFERENCE/google-sheets-embeds.md
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import type { H3Event } from 'h3'
import { setHeader } from 'h3'

import securityHeaders from '../../server/middleware/securityHeaders'

vi.mock('h3', () => ({
  setHeader: vi.fn(),
  getRequestURL: vi.fn(() => new URL('https://example.test/dashboard/view/x')),
}))

/** Origins a sheet or report frame navigates through; each must be allowed. */
const REQUIRED_FRAME_SRC = [
  'https://docs.google.com',
  'https://accounts.google.com',
  'https://lookerstudio.google.com',
  // Safari delivers a Looker CSV export by navigating the report frame to a
  // blob: URL; without it no file arrives (TC 2.3.15, 2026-10-04)
  'blob:',
]

const AUTH_DOMAIN = 'streamhub-test.web.app'

function frameSrc(csp: string): string[] {
  const directive = csp
    .split(';')
    .map(part => part.trim())
    .find(part => part.startsWith('frame-src '))
  expect(directive, `no frame-src in: ${csp}`).toBeDefined()
  return directive!.split(/\s+/).slice(1)
}

function middlewareCsp(authDomain: string): string {
  vi.stubGlobal('useRuntimeConfig', () => ({ public: { firebase: { authDomain } } }))
  securityHeaders({} as H3Event)
  const call = vi.mocked(setHeader).mock.calls.find(([, name]) => name === 'Content-Security-Policy')
  expect(call, 'middleware set no Content-Security-Policy').toBeDefined()
  return String(call![2])
}

interface HostingHeaderRule {
  source: string
  headers: { key: string, value: string }[]
}

function hostingCsps(): string[] {
  const config = JSON.parse(readFileSync(resolve(process.cwd(), 'firebase.json'), 'utf8')) as {
    hosting: { headers?: HostingHeaderRule[] } | { headers?: HostingHeaderRule[] }[]
  }
  const sites = Array.isArray(config.hosting) ? config.hosting : [config.hosting]
  return sites
    .flatMap(site => site.headers ?? [])
    .flatMap(rule => rule.headers)
    .filter(header => header.key === 'Content-Security-Policy')
    .map(header => header.value)
}

describe('CSP frame-src (BUG-036)', () => {
  beforeEach(() => {
    vi.mocked(setHeader).mockClear()
  })

  it('middleware allows every origin an embed navigates through', () => {
    const sources = frameSrc(middlewareCsp(AUTH_DOMAIN))
    for (const origin of REQUIRED_FRAME_SRC) {
      expect(sources).toContain(origin)
    }
  })

  it('firebase.json carries a CSP', () => {
    expect(hostingCsps().length).toBeGreaterThan(0)
  })

  it('firebase.json allows every origin an embed navigates through', () => {
    for (const csp of hostingCsps()) {
      const sources = frameSrc(csp)
      for (const origin of REQUIRED_FRAME_SRC) {
        expect(sources).toContain(origin)
      }
    }
  })

  it('middleware appends the runtime authDomain', () => {
    expect(frameSrc(middlewareCsp(AUTH_DOMAIN))).toContain(`https://${AUTH_DOMAIN}`)
  })

  it('middleware skips an unset placeholder authDomain', () => {
    expect(frameSrc(middlewareCsp('YOUR_AUTH_DOMAIN')).some(s => s.includes('YOUR_'))).toBe(false)
  })

  it('both lists agree apart from the runtime authDomain', () => {
    const fromMiddleware = frameSrc(middlewareCsp(AUTH_DOMAIN))
      .filter(source => source !== `https://${AUTH_DOMAIN}`)
      .sort()
    for (const csp of hostingCsps()) {
      expect(frameSrc(csp).sort()).toEqual(fromMiddleware)
    }
  })

  it('both keep frame-ancestors self', () => {
    for (const csp of [middlewareCsp(AUTH_DOMAIN), ...hostingCsps()]) {
      expect(csp).toContain("frame-ancestors 'self'")
    }
  })
})
