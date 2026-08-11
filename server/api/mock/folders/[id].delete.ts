import { deleteItem } from '../../../utils/jsonDatabase'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    console.log('[API] DELETE /api/mock/folders/:id -', id)

    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Folder ID is required'
      })
    }

    const deleted = await deleteItem('folders.json', id)

    if (!deleted) {
      throw createError({
        statusCode: 404,
        message: `Folder with ID "${id}" not found`
      })
    }

    return {
      success: true,
      deleted: true,
      message: `Folder "${id}" deleted successfully`
    }
  } catch (error: unknown) {
    console.error('[API] Error deleting folder:', getErrorMessage(error))
    if (getErrorStatus(error)) {
      throw error
    }
    throw createError({
      statusCode: 500,
      message: 'Failed to delete folder'
    })
  }
})
