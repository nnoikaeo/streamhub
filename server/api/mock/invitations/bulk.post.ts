import { readJSON, createItem } from '../../../utils/jsonDatabase'
import { logActivity } from '../../../utils/auditLog'
import type { Invitation } from '~/types/invitation'

interface UserRecord {
  uid: string
  email: string
  isActive: boolean
  [key: string]: any
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    console.log('[API] POST /api/mock/invitations/bulk')

    const { emails, role, company, message, assignedFolders, assignedGroups, invitedBy, invitedByName } = body

    if (!emails?.length || !role || !company) {
      throw createError({
        statusCode: 400,
        message: 'emails, role, and company are required'
      })
    }

    const invitations = await readJSON<Invitation>('invitations.json')
    const users = await readJSON<UserRecord>('users.json')

    const created: Invitation[] = []
    const skipped: { email: string; reason: string }[] = []

    for (const email of emails) {
      // Check if active user exists
      const activeUser = users.find(u => u.email === email && u.isActive)
      if (activeUser) {
        skipped.push({ email, reason: 'User already active' })
        continue
      }

      // Check if inactive user exists
      const inactiveUser = users.find(u => u.email === email && !u.isActive)
      if (inactiveUser) {
        skipped.push({ email, reason: 'User exists but inactive — use reactivate' })
        continue
      }

      // Check for existing pending invitation
      const pendingInv = invitations.find(
        inv => inv.email === email && inv.status === 'pending'
      )
      if (pendingInv) {
        skipped.push({ email, reason: 'Pending invitation already exists' })
        continue
      }

      const now = new Date()
      const invitation: Invitation = {
        id: `inv_${Date.now()}_${created.length}`,
        email,
        role,
        company,
        status: 'pending',
        invitedBy: invitedBy || 'system',
        invitedByName: invitedByName || 'System',
        message: message || '',
        assignedFolders: assignedFolders || [],
        assignedGroups: assignedGroups || [],
        invitationCode: crypto.randomUUID(),
        expiresAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      }

      const item = await createItem('invitations.json', invitation)
      created.push(item as Invitation)
    }

    // Audit log
    if (created.length > 0) {
      await logActivity({
        action: 'BULK_INVITE',
        performedBy: invitedBy || 'system',
        performedByEmail: invitedByName || 'System',
        target: `${created.length} emails`,
        metadata: {
          count: created.length,
          emails: created.map(inv => inv.email),
          skippedCount: skipped.length
        }
      })
    }

    return {
      success: true,
      data: {
        created,
        skipped
      }
    }
  } catch (error: any) {
    console.error('[API] Error bulk creating invitations:', error.message)
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to bulk create invitations'
    })
  }
})
