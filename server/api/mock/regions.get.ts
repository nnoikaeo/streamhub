import { readJSON } from '../../utils/jsonDatabase'

export default defineEventHandler(async () => {
  try {
    console.log('[API] GET /api/mock/regions')
    const regions = await readJSON('regions.json')
    return {
      success: true,
      data: regions,
      total: regions.length
    }
  } catch (error: unknown) {
    console.error('[API] Error fetching regions:', getErrorMessage(error))
    throw createError({
      statusCode: 500,
      message: 'Failed to read regions'
    })
  }
})
