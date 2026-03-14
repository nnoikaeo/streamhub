import { updateItem } from '../../../utils/jsonDatabase'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)
    console.log('[API] PUT /api/mock/tags/:id -', id)

    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Tag ID is required'
      })
    }

    const updated = await updateItem('tags.json', id, body)

    if (!updated) {
      throw createError({
        statusCode: 404,
        message: `Tag with ID "${id}" not found`
      })
    }

    return {
      success: true,
      data: updated,
      action: 'updated'
    }
  } catch (error: any) {
    console.error('[API] Error updating tag:', error.message)
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      message: 'Failed to update tag'
    })
  }
})
