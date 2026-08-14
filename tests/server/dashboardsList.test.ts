/**
 * Regression tests for server/api/mock/dashboards.get.ts — the no-uid fallback
 * path used by admin pages.
 *
 * The `?company=` filter read `d.access.company[companyFilter]`. `access.company`
 * is a list of company codes, not a map, so indexing it with a code always gave
 * `undefined` and the filter returned an empty list for every company. The bug
 * was invisible while the handler's data was cast to `any[]`; typing `readJSON`
 * surfaced it. `server/utils/companyAccess.ts` has always used `.includes()`.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { H3Event } from 'h3'

import { readJSON } from '../../server/utils/jsonDatabase'

vi.mock('../../server/utils/jsonDatabase', () => ({
  readJSON: vi.fn(),
}))

const { default: handler } = await import('../../server/api/mock/dashboards.get')

/** Stored dashboard rows, as the JSON store holds them. */
function storedDashboard(id: string, company: string[], folderId = 'folder_001') {
  return {
    id,
    name: id,
    folderId,
    access: { direct: { users: [], groups: [] }, company },
    restrictions: { revoke: [], expiry: {} },
    lookerEmbedUrl: `https://lookerstudio.google.com/embed/${id}`,
  }
}

const rows = [
  storedDashboard('dash_sth', ['STTH']),
  storedDashboard('dash_stn', ['STTN']),
  storedDashboard('dash_both', ['STTH', 'STTN']),
  storedDashboard('dash_none', []),
]

/**
 * No `context.auth` and no `uid` query param — the fallback path. The query
 * itself is supplied by stubbing h3's getQuery, which is what the handler calls.
 */
function makeEvent(): H3Event {
  return { context: {}, node: { req: {}, res: {} } } as unknown as H3Event
}

/**
 * The handler returns a forbidden envelope on the authenticated branch, so the
 * union has to be narrowed. Every test here takes the fallback branch.
 */
function expectListing(result: Awaited<ReturnType<typeof handler>>) {
  if (!('data' in result) || !Array.isArray(result.data)) {
    throw new Error(`expected a dashboard listing, got ${JSON.stringify(result)}`)
  }
  return result
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(readJSON).mockResolvedValue(rows)
})

describe('GET /api/mock/dashboards — no-uid fallback', () => {
  it('returns dashboards granted to the requested company', async () => {
    vi.stubGlobal('getQuery', () => ({ company: 'STTH' }))

    const result = expectListing(await handler(makeEvent()))

    expect(result.data.map(d => d.id)).toEqual(['dash_sth', 'dash_both'])
    expect(result.total).toBe(2)
  })

  it('does not return dashboards granted only to another company', async () => {
    vi.stubGlobal('getQuery', () => ({ company: 'STTN' }))

    const result = expectListing(await handler(makeEvent()))

    expect(result.data.map(d => d.id)).toEqual(['dash_stn', 'dash_both'])
  })

  it('returns nothing for a company with no grants', async () => {
    vi.stubGlobal('getQuery', () => ({ company: 'STCM' }))

    const result = expectListing(await handler(makeEvent()))

    expect(result.data).toEqual([])
  })

  it('returns every dashboard when no company filter is given', async () => {
    vi.stubGlobal('getQuery', () => ({}))

    const result = expectListing(await handler(makeEvent()))

    expect(result.data).toHaveLength(4)
  })

  it('strips lookerEmbedUrl from the listing', async () => {
    vi.stubGlobal('getQuery', () => ({ company: 'STTH' }))

    const result = expectListing(await handler(makeEvent()))

    for (const dashboard of result.data) {
      expect(dashboard).not.toHaveProperty('lookerEmbedUrl')
    }
  })

  it('combines the company and folderId filters', async () => {
    vi.mocked(readJSON).mockResolvedValue([
      storedDashboard('dash_a', ['STTH'], 'folder_001'),
      storedDashboard('dash_b', ['STTH'], 'folder_002'),
    ])
    vi.stubGlobal('getQuery', () => ({ company: 'STTH', folderId: 'folder_002' }))

    const result = expectListing(await handler(makeEvent()))

    expect(result.data.map(d => d.id)).toEqual(['dash_b'])
  })
})
