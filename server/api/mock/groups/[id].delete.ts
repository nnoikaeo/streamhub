import { deleteItem } from '../../../utils/jsonDatabase'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    console.log('[API] DELETE /api/mock/groups/:id -', id)

    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Group ID is required'
      })
    }

    const deleted = await deleteItem('groups.json', id)

    if (!deleted) {
      throw createError({
        statusCode: 404,
        message: `Group with ID "${id}" not found`
      })
    }

    return {
      success: true,
      deleted: true,
      message: `Group "${id}" deleted successfully`
    }
  } catch (error: any) {
    console.error('[API] Error deleting group:', error.message)
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      message: 'Failed to delete group'
    })
  }
})
