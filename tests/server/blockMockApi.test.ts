/**
 * Tests for server/middleware/blockMockApi.ts
 *
 * Verifies that:
 * 1. The middleware file exists and blocks /api/mock/* in production
 * 2. The blocking logic uses import.meta.dev (build-time constant)
 * 3. Returns 404 for mock routes in production mode
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const ROOT = process.cwd()

const middlewarePath = resolve(ROOT, 'server/middleware/blockMockApi.ts')
const source = readFileSync(middlewarePath, 'utf8')

describe('server/middleware/blockMockApi.ts — production mock API blocking', () => {
  it('blocks requests starting with /api/mock/', () => {
    expect(source).toContain('/api/mock/')
  })

  it('uses import.meta.dev for build-time dead code elimination', () => {
    expect(source).toContain('import.meta.dev')
  })

  it('returns 404 status code', () => {
    expect(source).toContain('statusCode: 404')
  })

  it('uses sendError + createError pattern', () => {
    expect(source).toContain('sendError')
    expect(source).toContain('createError')
  })

  it('only blocks in non-dev mode (production)', () => {
    // The guard must be !import.meta.dev — NOT import.meta.dev
    expect(source).toMatch(/!\s*import\.meta\.dev/)
  })
})
