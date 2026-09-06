/**
 * Tests for server/api/sheet/check-sharing.post.ts
 *
 * The endpoint answers one question — is this sheet shared "anyone with the
 * link" — because the failure it catches is invisible to whoever creates the
 * dashboard. A sheet that is not link-shared still renders for its owner in
 * Chrome and dead-ends for everyone on Safari/iOS (spike S1.3, S1.11).
 *
 * Two things below are security properties rather than behaviour: the probe URL
 * is rebuilt from the parsed sheet id (so the body cannot aim an outbound
 * request anywhere else), and the probe carries no credentials (so it measures
 * what an anonymous viewer sees, not what our server can reach).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { H3Event } from 'h3'

import { readBody } from 'h3'
import { validateCompanyAccess } from '../../server/utils/companyAccess'
import handler from '../../server/api/sheet/check-sharing.post'

vi.mock('../../server/utils/companyAccess', () => ({
  validateCompanyAccess: vi.fn(),
}))

vi.mock('../../server/utils/firestoreAdmin', () => ({
  isFirestoreMode: vi.fn(() => false),
  getAdminDb: vi.fn(() => null),
}))

vi.mock('../../server/utils/apiResponse', () => ({
  sendForbidden: vi.fn((_event, message) => ({ success: false, error: 'Forbidden', message })),
  sendUnauthorized: vi.fn((_event, message) => ({ success: false, error: 'Unauthorized', message })),
  sendBadRequest: vi.fn((_event, message) => ({ success: false, error: 'Bad Request', message })),
}))

vi.mock('h3', () => ({
  readBody: vi.fn(),
  setResponseStatus: vi.fn(),
}))

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0'
const PROBE_URL = 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/export?format=csv'

/** Only the four fields the role gate reads. */
function asUser(role: string, isActive = true) {
  return { uid: 'uid_1', role, isActive, company: 'STTH', groups: [] }
}

// `null`, not `undefined`, for the anonymous case — `undefined` would take the
// default and quietly test an authenticated call instead.
function makeEvent(uid: string | null = 'uid_1'): H3Event {
  return { context: uid ? { auth: { uid } } : {}, node: { req: {}, res: {} } } as unknown as H3Event
}

/** Stand-in for a Google response — only the status is read. */
function mockFetchStatus(status: number) {
  const fetchMock = vi.fn((_url: string, _init?: RequestInit) => Promise.resolve({ status } as Response))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function expectData(result: Awaited<ReturnType<typeof handler>>) {
  if (!('data' in result) || !result.data) {
    throw new Error(`expected a sharing result, got ${JSON.stringify(result)}`)
  }
  return result.data
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(readBody).mockResolvedValue({ url: SHEET_URL })
  vi.mocked(validateCompanyAccess).mockResolvedValue({ allowed: true, user: asUser('admin'), reason: 'Admin access' } as never)
})

describe('POST /api/sheet/check-sharing — the answer', () => {
  it('reports 200 as link-shared', async () => {
    mockFetchStatus(200)

    expect(expectData(await handler(makeEvent()))).toMatchObject({ isLinkShared: true, status: 200 })
  })

  it('reports 401 as not link-shared — the state that breaks Safari', async () => {
    mockFetchStatus(401)

    const data = expectData(await handler(makeEvent()))

    expect(data.isLinkShared).toBe(false)
    expect(data.message).toContain('Anyone with the link')
  })

  it('states the download risk when the sheet is shared, rather than reporting a clean pass', async () => {
    mockFetchStatus(200)

    // Link sharing is what makes the embed work AND what makes the raw file
    // downloadable without a login (S1.10). The form shows this as a warning.
    expect(expectData(await handler(makeEvent())).message).toMatch(/download the whole file/i)
  })

  it('does not call a network failure "not shared" — that would send an admin to change a correct setting', async () => {
    vi.stubGlobal('fetch', vi.fn((_url: string) => Promise.reject(new Error('ETIMEDOUT'))))

    const result = await handler(makeEvent())

    expect(result.success).toBe(false)
    expect(result).not.toHaveProperty('data')
  })
})

describe('POST /api/sheet/check-sharing — what it probes', () => {
  it('rebuilds the probe URL from the parsed sheet id, not from the body', async () => {
    const fetchMock = mockFetchStatus(200)

    await handler(makeEvent())

    expect(fetchMock).toHaveBeenCalledWith(PROBE_URL, expect.anything())
  })

  it('sends no credentials — the probe has to see what an anonymous viewer sees', async () => {
    const fetchMock = mockFetchStatus(200)

    await handler(makeEvent())

    const init = fetchMock.mock.calls[0]![1]!
    expect(init.headers).toEqual({ Accept: 'text/csv' })
    expect(init).not.toHaveProperty('credentials')
  })

  it('rejects a URL that is not a Google Sheet, without making a request', async () => {
    const fetchMock = mockFetchStatus(200)
    vi.mocked(readBody).mockResolvedValue({ url: 'https://docs.google.com.evil.test/spreadsheets/d/abc/edit' })

    const result = await handler(makeEvent())

    expect(result).toMatchObject({ success: false, error: 'Bad Request' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects a missing or non-string url', async () => {
    mockFetchStatus(200)
    for (const body of [{}, { url: 123 }, null]) {
      vi.mocked(readBody).mockResolvedValue(body)
      expect(await handler(makeEvent())).toMatchObject({ error: 'Bad Request' })
    }
  })
})

describe('POST /api/sheet/check-sharing — who may ask', () => {
  it('rejects an unauthenticated caller', async () => {
    const fetchMock = mockFetchStatus(200)

    expect(await handler(makeEvent(null))).toMatchObject({ error: 'Unauthorized' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects a plain user — otherwise this is an authenticated URL prober on our IP', async () => {
    const fetchMock = mockFetchStatus(200)
    vi.mocked(validateCompanyAccess).mockResolvedValue({ allowed: true, user: asUser('user'), reason: 'Company match' } as never)

    expect(await handler(makeEvent())).toMatchObject({ error: 'Forbidden' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('allows a moderator, who can create dashboards', async () => {
    mockFetchStatus(200)
    vi.mocked(validateCompanyAccess).mockResolvedValue({ allowed: true, user: asUser('moderator'), reason: 'Company match' } as never)

    expect(expectData(await handler(makeEvent())).isLinkShared).toBe(true)
  })

  it('rejects an inactive admin', async () => {
    mockFetchStatus(200)
    vi.mocked(validateCompanyAccess).mockResolvedValue({ allowed: true, user: asUser('admin', false), reason: 'Admin access' } as never)

    expect(await handler(makeEvent())).toMatchObject({ error: 'Forbidden' })
  })
})
