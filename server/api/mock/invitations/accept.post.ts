import { readJSON, updateItem, createItem } from '../../../utils/jsonDatabase'
import { logActivity } from '../../../utils/auditLog'
import type { Invitation } from '~/types/invitation'

interface UserRecord {
  uid: string
  email: string
  name: string
  role: string
  company: string
  groups: string[]
  isActive: boolean
  assignedFolders?: string[]
  [key: string]: any
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    console.log('[API] POST /api/mock/invitations/accept')

    const { invitationCode, uid, email, displayName, photoURL } = body

    if (!invitationCode || !uid || !email || !displayName) {
      throw createError({
        statusCode: 400,
        message: 'invitationCode, uid, email, and displayName are required'
      })
    }

    const invitations = await readJSON<Invitation>('invitations.json')
    const invitation = invitations.find(inv => inv.invitationCode === invitationCode)

    if (!invitation) {
      return { success: false, error: 'Invitation not found' }
    }

    // Security Check 1 — Email Matching (Pattern 2, case-insensitive)
    if (email.toLowerCase() !== invitation.email.toLowerCase()) {
      return { success: false, error: 'Email mismatch', message: 'The email you signed in with does not match the invitation email' }
    }

    // Security Check 2 — Race Condition Prevention
    if (invitation.status !== 'pending') {
      return { success: false, error: 'Already processed', message: 'This invitation has already been ' + invitation.status }
    }

    // Security Check 3 — Server-side Expiry
    if (new Date(invitation.expiresAt) <= new Date()) {
      await updateItem('invitations.json', invitation.id, { status: 'expired' as any })
      return { success: false, error: 'Expired', message: 'This invitation has expired' }
    }

    const now = new Date().toISOString()

    // Update invitation status
    const updatedInvitation = await updateItem<Invitation>('invitations.json', invitation.id, {
      status: 'accepted',
      acceptedAt: now,
      acceptedByUid: uid
    })

    // Create new user in users.json
    const newUser: UserRecord = {
      uid,
      email,
      name: displayName,
      role: invitation.role,
      company: invitation.company,
      groups: invitation.assignedGroups || [],
      isActive: true,
      createdAt: now,
      updatedAt: now
    }

    if (photoURL) {
      newUser.photoURL = photoURL
    }

    if (invitation.role === 'moderator' && invitation.assignedFolders?.length) {
      newUser.assignedFolders = invitation.assignedFolders
    }

    const createdUser = await createItem('users.json', newUser)

    // Audit log
    await logActivity({
      action: 'ACCEPT_INVITATION',
      performedBy: uid,
      performedByEmail: email,
      target: email,
      metadata: { invitationId: invitation.id, role: invitation.role, company: invitation.company }
    })

    return {
      success: true,
      data: {
        invitation: updatedInvitation,
        user: createdUser
      }
    }
  } catch (error: any) {
    console.error('[API] Error accepting invitation:', error.message)
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to accept invitation'
    })
  }
})
