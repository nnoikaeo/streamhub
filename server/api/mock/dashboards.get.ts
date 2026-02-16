import { readJSON, findMany } from '~/server/utils/jsonDatabase'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    console.log('[API] GET /api/mock/dashboards - params:', query)

    const dashboards = await readJSON('dashboards.json')

    // Filter by query parameters
    let filtered = dashboards

    if (query.uid) {
      filtered = filtered.filter((d: any) => d.uid === query.uid)
    }

    if (query.company) {
      filtered = filtered.filter((d: any) => d.company === query.company)
    }

    if (query.folderId) {
      filtered = filtered.filter((d: any) => d.folderId === query.folderId)
    }

    return {
      success: true,
      data: filtered,
      total: filtered.length
    }
  } catch (error: any) {
    console.error('[API] Error fetching dashboards:', error.message)
    throw createError({
      statusCode: 500,
      message: 'Failed to read dashboards'
    })
  }
})
