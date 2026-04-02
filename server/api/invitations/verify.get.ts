import { getAdminDb } from '../../utils/firestoreAdmin'
import type { Invitation } from '~/types/invitation'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const code = query.code as string
    console.log('[API] GET /api/invitations/verify')

    if (!code) {
      throw createError({
        statusCode: 400,
        message: 'Invitation code is required'
      })
    }

    const db = getAdminDb()
    if (!db) {
      throw createError({ statusCode: 503, message: 'Firestore not available' })
    }

    const snap = await db.collection('invitations')
      .where('invitationCode', '==', code)
      .limit(1)
      .get()

    if (snap.empty) {
      return { success: false, status: 'not_found' }
    }

    const invitation = { ...snap.docs[0]!.data(), id: snap.docs[0]!.id } as Invitation

    if (invitation.status === 'accepted') {
      return { success: false, status: 'already_accepted' }
    }

    if (invitation.status === 'cancelled') {
      return { success: false, status: 'cancelled' }
    }

    if (new Date(invitation.expiresAt) <= new Date()) {
      return { success: false, status: 'expired' }
    }

    if (invitation.status !== 'pending') {
      return { success: false, status: 'invalid' }
    }

    return {
      success: true,
      status: 'valid',
      data: {
        email: invitation.email,
        role: invitation.role,
        company: invitation.company,
        message: invitation.message,
        expiresAt: invitation.expiresAt
      }
    }
  } catch (error: any) {
    console.error('[API] Error verifying invitation:', error.message)
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: 'Failed to verify invitation'
    })
  }
})
