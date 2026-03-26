import { findById } from '../../../utils/jsonDatabase'

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

    const user = await findById('users.json', uid)

    if (!user) {
      throw createError({
        statusCode: 404,
        message: `User with ID "${uid}" not found`
      })
    }

    // Use verified auth context (from middleware) first, fallback to query param
    const requesterUid = event.context.auth?.uid || (query.requester as string)
    if (requesterUid) {
      const requester = await findById('users.json', requesterUid)
      if (requester && (requester as any).role !== 'admin') {
        if ((requester as any).company !== (user as any).company) {
          return sendForbidden(event, 'Cannot access user from different company')
        }
      }
    }

    return { success: true, data: user }
  } catch (error: any) {
    console.error('[API] Error fetching user:', error.message)
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: 'Failed to read user'
    })
  }
})
