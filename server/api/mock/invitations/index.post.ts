import { readJSON, createItem } from '../../../utils/jsonDatabase'
import { logActivity } from '../../../utils/auditLog'
import { sendInvitationEmail } from '../../../utils/emailService'
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
    console.log('[API] POST /api/mock/invitations -', body.email)

    if (!body.email || !body.role || !body.company) {
      throw createError({
        statusCode: 400,
        message: 'email, role, and company are required'
      })
    }

    // Pre-check: Check users.json for existing user with this email
    const users = await readJSON<UserRecord>('users.json')
    const existingUser = users.find(u => u.email === body.email)

    if (existingUser) {
      if (existingUser.isActive) {
        return {
          success: false,
          error: 'User already active',
          existingUser: { uid: existingUser.uid, email: existingUser.email }
        }
      } else {
        // Pattern 4 — Reactivation flow
        return {
          success: false,
          action: 'user_exists_inactive',
          existingUser: { uid: existingUser.uid, email: existingUser.email, role: existingUser.role, company: existingUser.company }
        }
      }
    }

    // Check for duplicate pending invitation
    const invitations = await readJSON<Invitation>('invitations.json')
    const pendingDuplicate = invitations.find(
      inv => inv.email === body.email && inv.status === 'pending'
    )

    if (pendingDuplicate) {
      throw createError({
        statusCode: 409,
        message: 'A pending invitation already exists for this email'
      })
    }

    const now = new Date()
    const expiresInDays = body.expiresInDays || 14
    const expiresAt = new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000)

    const invitation: Invitation = {
      id: `inv_${Date.now()}`,
      email: body.email,
      role: body.role,
      company: body.company,
      status: 'pending',
      invitedBy: body.invitedBy || 'system',
      invitedByName: body.invitedByName || 'System',
      message: body.message || '',
      assignedFolders: body.assignedFolders || [],
      assignedGroups: body.assignedGroups || [],
      invitationCode: crypto.randomUUID(),
      expiresAt: expiresAt.toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    }

    const created = await createItem('invitations.json', invitation)

    // Send invitation email (best-effort — failure does not block invitation creation)
    const emailSent = await sendInvitationEmail({
      to: invitation.email,
      inviterName: invitation.invitedByName,
      role: invitation.role,
      company: invitation.company,
      invitationCode: invitation.invitationCode,
      message: invitation.message,
      expiresAt: invitation.expiresAt
    })

    // Audit log
    await logActivity({
      action: 'INVITE_USER',
      performedBy: body.invitedBy || 'system',
      performedByEmail: body.invitedByName || 'System',
      target: body.email,
      metadata: { role: body.role, company: body.company, invitationId: invitation.id, emailSent }
    })

    return {
      success: true,
      data: created,
      action: 'created',
      emailSent
    }
  } catch (error: any) {
    console.error('[API] Error creating invitation:', error.message)
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to create invitation'
    })
  }
})
