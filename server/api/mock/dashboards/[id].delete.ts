import { deleteItem } from '~/server/utils/jsonDatabase'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    console.log('[API] DELETE /api/mock/dashboards/:id -', id)

    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Dashboard ID is required'
      })
    }

    const deleted = await deleteItem('dashboards.json', id)

    if (!deleted) {
      throw createError({
        statusCode: 404,
        message: `Dashboard with ID "${id}" not found`
      })
    }

    return {
      success: true,
      deleted: true,
      message: `Dashboard "${id}" deleted successfully`
    }
  } catch (error: any) {
    console.error('[API] Error deleting dashboard:', error.message)
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      message: 'Failed to delete dashboard'
    })
  }
})
