import { findById } from '../../../utils/jsonDatabase'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    console.log('[API] GET /api/mock/folders/:id -', id)

    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Folder ID is required'
      })
    }

    const folder = await findById('folders.json', id)

    if (!folder) {
      throw createError({
        statusCode: 404,
        message: `Folder with ID "${id}" not found`
      })
    }

    return {
      success: true,
      data: folder
    }
  } catch (error: any) {
    console.error('[API] Error fetching folder:', error.message)
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      message: 'Failed to read folder'
    })
  }
})
