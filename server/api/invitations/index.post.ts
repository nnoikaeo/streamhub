import { getAdminDb, fsQuery } from '../../utils/firestoreAdmin'
import { logActivity } from '../../utils/auditLog'
import { sendInvitationEmail } from '../../utils/emailService'
import type { Invitation, StoredUser } from '~/types/invitation'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    console.log('[API] POST /api/invitations -', body.email)

    if (!body.email || !body.role || !body.company) {
      throw createError({
        statusCode: 400,
        message: 'email, role, and company are required'
      })
    }

    const db = getAdminDb()
    if (!db) {
      throw createError({ statusCode: 503, message: 'Firestore not available' })
    }

    // Pre-check: Check users collection for existing user with this email
    const existingUsers = await fsQuery<StoredUser>(db, 'users', 'email', body.email)
    const existingUser = existingUsers[0]

    if (existingUser) {
      if (existingUser.isActive) {
        return {
          success: false,
          error: 'User already active',
          existingUser: { uid: existingUser.uid, email: existingUser.email }
        }
      } else {
        return {
          success: false,
          action: 'user_exists_inactive',
          existingUser: { uid: existingUser.uid, email: existingUser.email, role: existingUser.role, company: existingUser.company }
        }
      }
    }

    // Check for duplicate pending invitation
    const pendingInvs = await fsQuery<Invitation>(db, 'invitations', 'email', body.email)
    const pendingDuplicate = pendingInvs.find(inv => inv.status === 'pending')

    if (pendingDuplicate) {
      throw createError({
        statusCode: 409,
        message: 'A pending invitation already exists for this email'
      })
    }

    const now = new Date()
    const expiresInDays = body.expiresInDays || 14
    const expiresAt = new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000)
    const id = `inv_${Date.now()}`

    const invitation: Invitation = {
      id,
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

    await db.collection('invitations').doc(id).set(invitation)

    // Send invitation email (best-effort)
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
      metadata: { role: body.role, company: body.company, invitationId: id, emailSent }
    })

    return {
      success: true,
      data: invitation,
      action: 'created',
      emailSent
    }
  } catch (error: unknown) {
    console.error('[API] Error creating invitation:', getErrorMessage(error))
    if (getErrorStatus(error)) throw error
    throw createError({
      statusCode: 500,
      message: getErrorMessage(error, 'Failed to create invitation')
    })
  }
})
