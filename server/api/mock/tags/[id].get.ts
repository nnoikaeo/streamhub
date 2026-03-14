import { findById } from '../../../utils/jsonDatabase'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    console.log('[API] GET /api/mock/tags/:id -', id)

    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Tag ID is required'
      })
    }

    const tag = await findById('tags.json', id)

    if (!tag) {
      throw createError({
        statusCode: 404,
        message: `Tag with ID "${id}" not found`
      })
    }

    return {
      success: true,
      data: tag
    }
  } catch (error: any) {
    console.error('[API] Error fetching tag:', error.message)
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch tag'
    })
  }
})
