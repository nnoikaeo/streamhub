import { deleteItem } from '../../../utils/jsonDatabase'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    console.log('[API] DELETE /api/mock/tags/:id -', id)

    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Tag ID is required'
      })
    }

    const deleted = await deleteItem('tags.json', id)

    if (!deleted) {
      throw createError({
        statusCode: 404,
        message: `Tag with ID "${id}" not found`
      })
    }

    return {
      success: true,
      deleted: true,
      message: `Tag "${id}" deleted successfully`
    }
  } catch (error: any) {
    console.error('[API] Error deleting tag:', error.message)
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      message: 'Failed to delete tag'
    })
  }
})
