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
  } catch (error: unknown) {
    console.error('[API] Error creating tag:', getErrorMessage(error))
    if (getErrorStatus(error)) {
      throw error
    }
    throw createError({
      statusCode: 500,
      message: getErrorMessage(error, 'Failed to create tag')
    })
  }
})
