import { deleteItem } from '../../../utils/jsonDatabase'

export default defineEventHandler(async (event) => {
  try {
    const uid = getRouterParam(event, 'uid')
    console.log('[API] DELETE /api/mock/users/:uid -', uid)

    if (!uid) {
      throw createError({
        statusCode: 400,
        message: 'User ID is required'
      })
    }

    const deleted = await deleteItem('users.json', uid)

    if (!deleted) {
      throw createError({
        statusCode: 404,
        message: `User with ID "${uid}" not found`
      })
    }

    return {
      success: true,
      deleted: true,
      message: `User "${uid}" deleted successfully`
    }
  } catch (error: unknown) {
    console.error('[API] Error deleting user:', getErrorMessage(error))
    if (getErrorStatus(error)) {
      throw error
    }
    throw createError({
      statusCode: 500,
      message: 'Failed to delete user'
    })
  }
})
