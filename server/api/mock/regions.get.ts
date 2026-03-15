import { readJSON } from '../../utils/jsonDatabase'

export default defineEventHandler(async (event) => {
  try {
    console.log('[API] GET /api/mock/regions')
    const regions = await readJSON('regions.json')
    return {
      success: true,
      data: regions,
      total: regions.length
    }
  } catch (error: any) {
    console.error('[API] Error fetching regions:', error.message)
    throw createError({
      statusCode: 500,
      message: 'Failed to read regions'
    })
  }
})
