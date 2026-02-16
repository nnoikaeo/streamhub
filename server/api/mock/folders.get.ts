import { readJSON } from '~/server/utils/jsonDatabase'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    console.log('[API] GET /api/mock/folders - params:', query)

    const folders = await readJSON('folders.json')

    // Filter by query parameters
    let filtered = folders

    if (query.uid) {
      filtered = filtered.filter((f: any) => f.uid === query.uid)
    }

    if (query.company) {
      filtered = filtered.filter((f: any) => f.company === query.company)
    }

    if (query.parentId) {
      filtered = filtered.filter((f: any) => f.parentId === query.parentId)
    }

    return {
      success: true,
      data: filtered,
      total: filtered.length
    }
  } catch (error: any) {
    console.error('[API] Error fetching folders:', error.message)
    throw createError({
      statusCode: 500,
      message: 'Failed to read folders'
    })
  }
})
