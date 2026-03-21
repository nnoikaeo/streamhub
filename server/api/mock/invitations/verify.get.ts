import { readJSON } from '../../../utils/jsonDatabase'
import type { Invitation } from '~/types/invitation'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const code = query.code as string
    console.log('[API] GET /api/mock/invitations/verify')

    if (!code) {
      throw createError({
        statusCode: 400,
        message: 'Invitation code is required'
      })
    }

    const invitations = await readJSON<Invitation>('invitations.json')
    const invitation = invitations.find(inv => inv.invitationCode === code)

    if (!invitation) {
      return { success: false, status: 'not_found' }
    }

    if (invitation.status === 'accepted') {
      return { success: false, status: 'already_accepted' }
    }

    if (invitation.status === 'cancelled') {
      return { success: false, status: 'cancelled' }
    }

    // Server-side expiry check
    if (new Date(invitation.expiresAt) <= new Date()) {
      return { success: false, status: 'expired' }
    }

    if (invitation.status !== 'pending') {
      return { success: false, status: 'invalid' }
    }

    // Return safe data only — no sensitive fields
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
