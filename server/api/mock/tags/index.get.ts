import { readJSON } from '../../../utils/jsonDatabase'

export default defineEventHandler(async (event) => {
  try {
    console.log('[API] GET /api/mock/tags')
    const tags = await readJSON('tags.json')
    return {
      success: true,
      data: tags,
      total: tags.length
    }
  } catch (error: any) {
    console.error('[API] Error fetching tags:', error.message)
    throw createError({
      statusCode: 500,
      message: 'Failed to read tags'
    })
  }
})
