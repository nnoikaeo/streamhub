import { findById } from '../../../utils/jsonDatabase'
import type { User } from '~/types/dashboard'

export default defineEventHandler(async (event) => {
  try {
    const uid = getRouterParam(event, 'uid')
    const query = getQuery(event)
    console.log('[API] GET /api/mock/users/:uid -', uid)

    if (!uid) {
      throw createError({
        statusCode: 400,
        message: 'User ID is required'
      })
    }

    const user = await findById<User>('users.json', uid)

    if (!user) {
      throw createError({
        statusCode: 404,
        message: `User with ID "${uid}" not found`
      })
    }

    // Use verified auth context (from middleware) first, fallback to query param
    const requesterUid = event.context.auth?.uid || (query.requester as string)
    if (requesterUid) {
      const requester = await findById<User>('users.json', requesterUid)
      if (requester && requester.role !== 'admin') {
        if (requester.company !== user.company) {
          return sendForbidden(event, 'Cannot access user from different company')
        }
      }
    }

    return { success: true, data: user }
  } catch (error: unknown) {
    console.error('[API] Error fetching user:', getErrorMessage(error))
    if (getErrorStatus(error)) throw error
    throw createError({
      statusCode: 500,
      message: 'Failed to read user'
    })
  }
})
