import { describe, it, expect, vi, beforeEach } from 'vitest'

// --- Mock dependencies before importing handlers ---

// Mock embedTokenStore
vi.mock('../../server/utils/embedTokenStore', () => ({
  createToken: vi.fn(() => 'mock-token-uuid'),
  consumeToken: vi.fn(),
}))

// Mock jsonDatabase
vi.mock('../../server/utils/jsonDatabase', () => ({
  findById: vi.fn(),
  readJSON: vi.fn(() => []),
}))

// Mock companyAccess
vi.mock('../../server/utils/companyAccess', () => ({
  validateCompanyAccess: vi.fn(),
  checkDashboardAccess: vi.fn(),
}))

// Mock apiResponse
vi.mock('../../server/utils/apiResponse', () => ({
  sendForbidden: vi.fn((_event, message) => ({ success: false, error: 'Forbidden', message })),
  sendUnauthorized: vi.fn((_event, message) => ({ success: false, error: 'Unauthorized', message })),
}))

// Mock h3 utilities used by handlers
vi.mock('h3', () => ({
  readBody: vi.fn(),
  sendRedirect: vi.fn((_event, url, code) => ({ __redirect: true, url, code })),
  setResponseStatus: vi.fn(),
}))

import { readBody, sendRedirect } from 'h3'
import { createToken, consumeToken } from '../../server/utils/embedTokenStore'
import { findById, readJSON } from '../../server/utils/jsonDatabase'
import { validateCompanyAccess, checkDashboardAccess } from '../../server/utils/companyAccess'

// Import handlers (defineEventHandler is mocked to return the function directly)
import requestHandler from '../../server/api/embed/request.post'
import tokenHandler from '../../server/api/embed/[token].get'

// Helper: create a fake H3Event
function createMockEvent(overrides: any = {}) {
  return {
    context: { auth: { uid: 'user_admin' }, ...overrides.context },
    node: { req: {}, res: {} },
    ...overrides,
  } as any
}

// ========================================
// POST /api/embed/request
// ========================================
describe('POST /api/embed/request', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return token and proxyUrl for valid request', async () => {
    const event = createMockEvent()
    vi.mocked(readBody).mockResolvedValue({ dashboardId: 'dash_001' })
    vi.mocked(validateCompanyAccess).mockResolvedValue({ allowed: true, user: { uid: 'user_admin', role: 'admin' }, reason: 'Admin access' })
    vi.mocked(findById).mockResolvedValue({ id: 'dash_001', lookerEmbedUrl: 'https://lookerstudio.google.com/embed/abc' })
    vi.mocked(checkDashboardAccess).mockReturnValue({ allowed: true, reason: 'Admin access' })
    vi.mocked(createToken).mockReturnValue('test-uuid-token')

    const result = await requestHandler(event)

    expect(result).toEqual({
      success: true,
      data: {
        token: 'test-uuid-token',
        proxyUrl: '/api/embed/test-uuid-token',
      },
    })
    expect(createToken).toHaveBeenCalledWith('https://lookerstudio.google.com/embed/abc', 'user_admin')
  })

  it('should throw 400 if dashboardId is missing', async () => {
    const event = createMockEvent()
    vi.mocked(readBody).mockResolvedValue({})

    await expect(requestHandler(event)).rejects.toThrow('dashboardId is required')
  })

  it('should return 401 if no auth uid', async () => {
    const event = createMockEvent({ context: { auth: null } })
    vi.mocked(readBody).mockResolvedValue({ dashboardId: 'dash_001' })

    const result = await requestHandler(event)

    expect(result).toEqual({ success: false, error: 'Unauthorized', message: 'Authentication required' })
  })

  it('should return 403 if company access denied', async () => {
    const event = createMockEvent()
    vi.mocked(readBody).mockResolvedValue({ dashboardId: 'dash_001' })
    vi.mocked(validateCompanyAccess).mockResolvedValue({ allowed: false, user: null, reason: 'User not found' })

    const result = await requestHandler(event)

    expect(result).toEqual({ success: false, error: 'Forbidden', message: 'User not found' })
  })

  it('should throw 404 if dashboard not found', async () => {
    const event = createMockEvent()
    vi.mocked(readBody).mockResolvedValue({ dashboardId: 'nonexistent' })
    vi.mocked(validateCompanyAccess).mockResolvedValue({ allowed: true, user: { uid: 'user_admin', role: 'admin' }, reason: 'ok' })
    vi.mocked(findById).mockResolvedValue(null)

    await expect(requestHandler(event)).rejects.toThrow('Dashboard "nonexistent" not found')
  })

  it('should return 403 if dashboard access denied', async () => {
    const event = createMockEvent()
    vi.mocked(readBody).mockResolvedValue({ dashboardId: 'dash_001' })
    vi.mocked(validateCompanyAccess).mockResolvedValue({ allowed: true, user: { uid: 'user1', role: 'user' }, reason: 'ok' })
    vi.mocked(findById).mockResolvedValue({ id: 'dash_001', lookerEmbedUrl: 'https://example.com' })
    vi.mocked(checkDashboardAccess).mockReturnValue({ allowed: false, reason: 'No matching access rule' })

    const result = await requestHandler(event)

    expect(result).toEqual({ success: false, error: 'Forbidden', message: 'No matching access rule' })
  })

  it('should throw 404 if dashboard has no embed URL', async () => {
    const event = createMockEvent()
    vi.mocked(readBody).mockResolvedValue({ dashboardId: 'dash_001' })
    vi.mocked(validateCompanyAccess).mockResolvedValue({ allowed: true, user: { uid: 'user_admin', role: 'admin' }, reason: 'ok' })
    vi.mocked(findById).mockResolvedValue({ id: 'dash_001' }) // no lookerEmbedUrl
    vi.mocked(checkDashboardAccess).mockReturnValue({ allowed: true, reason: 'ok' })

    await expect(requestHandler(event)).rejects.toThrow('No embed URL configured for this dashboard')
  })
})

// ========================================
// GET /api/embed/[token]
// ========================================
describe('GET /api/embed/[token]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should 302 redirect to embed URL for valid token', async () => {
    const event = createMockEvent()
    vi.mocked((globalThis as any).getRouterParam).mockReturnValue('valid-token')
    vi.mocked(consumeToken).mockReturnValue('https://lookerstudio.google.com/embed/abc')

    const result = await tokenHandler(event)

    expect(sendRedirect).toHaveBeenCalledWith(event, 'https://lookerstudio.google.com/embed/abc', 302)
  })

  it('should throw 403 for invalid/expired token', async () => {
    const event = createMockEvent()
    vi.mocked((globalThis as any).getRouterParam).mockReturnValue('expired-token')
    vi.mocked(consumeToken).mockReturnValue(null)

    await expect(tokenHandler(event)).rejects.toThrow('Invalid or expired token')
  })

  it('should throw 400 if token param is missing', async () => {
    const event = createMockEvent()
    vi.mocked((globalThis as any).getRouterParam).mockReturnValue(undefined)

    await expect(tokenHandler(event)).rejects.toThrow('Token is required')
  })
})
