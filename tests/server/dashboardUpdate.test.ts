import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { H3Event } from 'h3'

import { findById, updateItem } from '../../server/utils/jsonDatabase'
import { logAuditEvent } from '../../server/utils/auditLog'
import handler from '../../server/api/mock/dashboards/[id].put'

// --- Mock dependencies before importing handler ---

vi.mock('../../server/utils/jsonDatabase', () => ({
    findById: vi.fn(),
    updateItem: vi.fn(),
}))

vi.mock('../../server/utils/auditLog', () => ({
    logAuditEvent: vi.fn(() => Promise.resolve()),
}))

// Mock h3 utilities
vi.stubGlobal('readBody', vi.fn())
vi.stubGlobal('getHeader', vi.fn(() => ''))

interface AuthContext {
    uid: string
    email?: string
}

// Helper: create a fake H3Event. The handler only reads `context.auth`, so the
// stub is deliberately partial and asserted through `unknown` rather than `any`.
function createMockEvent(id: string | undefined, body: unknown, auth?: AuthContext): H3Event {
    vi.mocked(getRouterParam).mockReturnValue(id)
    vi.mocked(readBody).mockResolvedValue(body)
    return {
        context: { auth: auth || { uid: 'user_admin', email: 'admin@test.com' } },
        node: { req: {}, res: {} },
    } as unknown as H3Event
}

// Sample existing dashboard. Dates are ISO strings because the JSON store keeps
// them that way — `Dashboard` declares them as Date, so the fixture describes the
// stored shape rather than pretending to be a hydrated Dashboard.
const existingDashboard = {
    id: 'dash_001',
    name: 'Original Name',
    description: 'Original desc',
    type: 'looker',
    folderId: 'folder_001',
    tags: ['tag_sales'],
    isArchived: false,
    owner: 'user_admin',
    access: { direct: { users: [], groups: [] }, company: [] },
    restrictions: { revoke: [], expiry: {} },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    updatedBy: 'user_admin',
}

// The user the handler looks up to denormalise the audit entry.
const auditUser = {
    uid: 'user_admin',
    name: 'Admin',
    email: 'admin@test.com',
    company: 'STTH',
    role: 'admin',
    groups: [],
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
}

describe('PUT /api/mock/dashboards/:id', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should update name and description', async () => {
        const body = { name: 'New Name', description: 'New desc' }
        const event = createMockEvent('dash_001', body)

        vi.mocked(findById)
            .mockResolvedValueOnce(existingDashboard) // dashboard lookup
            .mockResolvedValueOnce(auditUser) // user lookup for audit

        const updatedData = { ...existingDashboard, ...body, updatedAt: expect.any(String) }
        vi.mocked(updateItem).mockResolvedValue(updatedData)

        const result = await handler(event)

        expect(result).toEqual({ success: true, data: updatedData })
        expect(updateItem).toHaveBeenCalledWith('dashboards.json', 'dash_001', expect.objectContaining({
            name: 'New Name',
            description: 'New desc',
            updatedAt: expect.any(String),
        }))
    })

    it('should update tags array', async () => {
        const body = { tags: ['tag_sales', 'tag_finance'] }
        const event = createMockEvent('dash_001', body)

        vi.mocked(findById)
            .mockResolvedValueOnce(existingDashboard)
            .mockResolvedValueOnce(auditUser)

        const updatedData = { ...existingDashboard, tags: ['tag_sales', 'tag_finance'], updatedAt: expect.any(String) }
        vi.mocked(updateItem).mockResolvedValue(updatedData)

        const result = await handler(event)

        expect(result).toEqual({ success: true, data: updatedData })
        expect(updateItem).toHaveBeenCalledWith('dashboards.json', 'dash_001', expect.objectContaining({
            tags: ['tag_sales', 'tag_finance'],
        }))
    })

    it('should set updatedAt timestamp', async () => {
        const body = { name: 'Updated' }
        const event = createMockEvent('dash_001', body)

        vi.mocked(findById)
            .mockResolvedValueOnce(existingDashboard)
            .mockResolvedValueOnce(null) // no user found for audit

        vi.mocked(updateItem).mockResolvedValue({ ...existingDashboard, ...body })

        await handler(event)

        const updateCall = vi.mocked(updateItem).mock.calls[0]!
        const updates = updateCall[2]
        // updatedAt should be a valid ISO date string
        expect(new Date(updates.updatedAt).toISOString()).toBe(updates.updatedAt)
    })

    it('should return 404 for non-existent dashboard', async () => {
        const body = { name: 'Test' }
        const event = createMockEvent('dash_nonexistent', body)

        vi.mocked(findById).mockResolvedValue(null)

        await expect(handler(event)).rejects.toMatchObject({
            statusCode: 404,
            message: expect.stringContaining('not found'),
        })
        expect(updateItem).not.toHaveBeenCalled()
    })

    it('should return 400 when id is missing', async () => {
        const event = createMockEvent(undefined, { name: 'Test' }, { uid: 'user_admin' })

        await expect(handler(event)).rejects.toMatchObject({
            statusCode: 400,
            message: 'Dashboard ID is required',
        })
    })

    it('should only allow whitelisted fields', async () => {
        const body = { name: 'Valid', _malicious: 'evil', owner: 'hacker', id: 'tampered' }
        const event = createMockEvent('dash_001', body)

        vi.mocked(findById)
            .mockResolvedValueOnce(existingDashboard)
            .mockResolvedValueOnce(null)

        vi.mocked(updateItem).mockResolvedValue(existingDashboard)

        await handler(event)

        const updateCall = vi.mocked(updateItem).mock.calls[0]!
        const updates = updateCall[2]
        // Whitelisted field should be present
        expect(updates.name).toBe('Valid')
        expect(updates.owner).toBe('hacker') // owner is allowed
        // Non-whitelisted fields should NOT be present
        expect(updates._malicious).toBeUndefined()
        expect(updates.id).toBeUndefined()
    })

    it('should log audit event with action "edit"', async () => {
        const body = { name: 'Edited Name' }
        const event = createMockEvent('dash_001', body)

        vi.mocked(findById)
            .mockResolvedValueOnce(existingDashboard)
            .mockResolvedValueOnce(auditUser)

        vi.mocked(updateItem).mockResolvedValue({ ...existingDashboard, ...body })

        await handler(event)

        // Wait for fire-and-forget audit log
        await new Promise(r => setTimeout(r, 10))

        expect(logAuditEvent).toHaveBeenCalledWith(expect.objectContaining({
            action: 'edit',
            userId: 'user_admin',
            dashboardId: 'dash_001',
        }))
    })

    it('should log audit action "archive" when archiving', async () => {
        const body = { isArchived: true }
        const event = createMockEvent('dash_001', body)

        vi.mocked(findById)
            .mockResolvedValueOnce(existingDashboard)
            .mockResolvedValueOnce(auditUser)

        vi.mocked(updateItem).mockResolvedValue({ ...existingDashboard, isArchived: true })

        await handler(event)

        await new Promise(r => setTimeout(r, 10))

        expect(logAuditEvent).toHaveBeenCalledWith(expect.objectContaining({
            action: 'archive',
        }))
    })
})
