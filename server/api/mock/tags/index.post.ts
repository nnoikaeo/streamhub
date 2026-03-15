import { createItem } from '../../../utils/jsonDatabase'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    console.log('[API] POST /api/mock/tags -', body)

    if (!body.id) {
      throw createError({
        statusCode: 400,
        message: 'Tag id is required'
      })
    }

    const created = await createItem('tags.json', body)
    return {
      success: true,
      data: created,
      action: 'created'
    }
  } catch (error: any) {
    console.error('[API] Error creating tag:', error.message)
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to create tag'
    })
  }
})
