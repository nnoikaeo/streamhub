import { readJSON } from '../../../utils/jsonDatabase'
import type { Invitation } from '~/types/invitation'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const email = query.email as string
    console.log('[API] GET /api/mock/invitations/check -', email)

    if (!email) {
      throw createError({
        statusCode: 400,
        message: 'Email query parameter is required'
      })
    }

    const invitations = await readJSON<Invitation>('invitations.json')
    const pending = invitations.find(
      inv => inv.email === email
        && inv.status === 'pending'
        && new Date(inv.expiresAt) > new Date()
    )

    return {
      success: true,
      data: pending || null,
      found: !!pending
    }
  } catch (error: unknown) {
    console.error('[API] Error checking invitation:', getErrorMessage(error))
    if (getErrorStatus(error)) throw error
    throw createError({
      statusCode: 500,
      message: 'Failed to check invitation'
    })
  }
})
