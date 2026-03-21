import { deleteItem } from '../../../utils/jsonDatabase'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    console.log('[API] DELETE /api/mock/invitations/:id -', id)

    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Invitation ID is required'
      })
    }

    const deleted = await deleteItem('invitations.json', id)

    if (!deleted) {
      throw createError({
        statusCode: 404,
        message: `Invitation with ID "${id}" not found`
      })
    }

    return {
      success: true,
      deleted: true,
      message: `Invitation "${id}" deleted successfully`
    }
  } catch (error: any) {
    console.error('[API] Error deleting invitation:', error.message)
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: 'Failed to delete invitation'
    })
  }
})
