import { getAdminDb } from '../../utils/firestoreAdmin'
import { logActivity } from '../../utils/auditLog'
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
    console.log('[API] POST /api/invitations/accept')

    const { invitationCode, uid, email, displayName, photoURL } = body

    if (!invitationCode || !uid || !email || !displayName) {
      throw createError({
        statusCode: 400,
        message: 'invitationCode, uid, email, and displayName are required'
      })
    }

    const db = getAdminDb()
    if (!db) {
      throw createError({ statusCode: 503, message: 'Firestore not available' })
    }

    // Find invitation by code
    const snap = await db.collection('invitations')
      .where('invitationCode', '==', invitationCode)
      .limit(1)
      .get()

    if (snap.empty) {
      return { success: false, error: 'Invitation not found' }
    }

    const invDoc = snap.docs[0]!
    const invitation = { ...invDoc.data(), id: invDoc.id } as Invitation

    // Security Check 1 — Email Matching (case-insensitive)
    if (email.toLowerCase() !== invitation.email.toLowerCase()) {
      return { success: false, error: 'Email mismatch', message: 'The email you signed in with does not match the invitation email' }
    }

    // Security Check 2 — Race Condition Prevention
    if (invitation.status !== 'pending') {
      return { success: false, error: 'Already processed', message: 'This invitation has already been ' + invitation.status }
    }

    // Security Check 3 — Server-side Expiry
    if (new Date(invitation.expiresAt) <= new Date()) {
      await db.collection('invitations').doc(invDoc.id).update({ status: 'expired', updatedAt: new Date().toISOString() })
      return { success: false, error: 'Expired', message: 'This invitation has expired' }
    }

    const now = new Date().toISOString()

    // Update invitation status
    const invitationUpdates = {
      status: 'accepted' as const,
      acceptedAt: now,
      acceptedByUid: uid,
      updatedAt: now
    }
    await db.collection('invitations').doc(invDoc.id).update(invitationUpdates)

    const updatedInvitation: Invitation = { ...invitation, ...invitationUpdates }

    // Create new user in Firestore
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

    await db.collection('users').doc(uid).set(newUser)

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
        user: newUser
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
