import { readJSON, findMany } from '../../utils/jsonDatabase'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    console.log('[API] GET /api/mock/dashboards')
    console.log('  📥 Query params:', query)

    const dashboards = await readJSON('dashboards.json')
    console.log(`  📊 Total dashboards loaded: ${dashboards.length}`)

    // Filter by query parameters
    let filtered = dashboards

    if (query.company) {
      filtered = filtered.filter((d: any) => d.access?.company?.[query.company as string])
      console.log(`  🔍 After company filter (${query.company}): ${filtered.length}`)
    }

    if (query.folderId) {
      filtered = filtered.filter((d: any) => d.folderId === query.folderId)
      console.log(`  🔍 After folderId filter: ${filtered.length}`)
    }

    console.log(`  ✅ Returning: ${filtered.length} dashboards`)
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
