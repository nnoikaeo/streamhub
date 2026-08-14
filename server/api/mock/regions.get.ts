import { readJSON } from '../../utils/jsonDatabase'
import type { Region } from '~/types/admin'

export default defineEventHandler(async () => {
  try {
    console.log('[API] GET /api/mock/regions')
    const regions = await readJSON<Region>('regions.json')
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
