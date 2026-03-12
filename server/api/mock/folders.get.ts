import { readJSON } from '../../utils/jsonDatabase'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    console.log('[API] GET /api/mock/folders')
    console.log('  📥 Query params:', query)

    const folders = await readJSON('folders.json')
    console.log(`  📂 Total folders loaded: ${folders.length}`)

    // Filter by query parameters
    let filtered = folders

    if (query.parentId) {
      filtered = filtered.filter((f: any) => f.parentId === query.parentId)
      console.log(`  🔍 After parentId filter: ${filtered.length}`)
    }

    console.log(`  ✅ Returning: ${filtered.length} folders`)
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
