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

    // Security Check — Email Matching (Pattern 2)
    if (email !== invitation.email) {
      return { success: false, error: 'Email mismatch' }
    }

    // Race Condition Prevention — check status again
    if (invitation.status !== 'pending') {
      return { success: false, error: `Invitation is ${invitation.status}, not pending` }
    }

    // Server-side Expiry Check
    if (new Date(invitation.expiresAt) <= new Date()) {
      return { success: false, error: 'Invitation has expired' }
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
