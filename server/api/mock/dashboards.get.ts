import { readJSON } from '../../utils/jsonDatabase'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    console.log('[API] GET /api/mock/dashboards')
    console.log('  📥 Query params:', query)

    const uid = query.uid as string
    const companyFilter = query.company as string

    // If uid provided: validate company access and filter by permissions
    if (uid) {
      const accessResult = await validateCompanyAccess(event, companyFilter)
      if (!accessResult.allowed) {
        return sendForbidden(event, accessResult.reason)
      }

      const dashboards = await readJSON('dashboards.json')
      console.log(`  📊 Total dashboards loaded: ${dashboards.length}`)

      let filtered = filterAccessibleDashboards(dashboards as any[], accessResult.user)

      if (query.folderId) {
        filtered = filtered.filter((d: any) => d.folderId === query.folderId)
        console.log(`  🔍 After folderId filter: ${filtered.length}`)
      }

      console.log(`  ✅ Returning: ${filtered.length} dashboards`)
      return { success: true, data: filtered, total: filtered.length }
    }

    // Fallback: no uid (admin pages, backward compatible)
    const dashboards = await readJSON('dashboards.json')
    console.log(`  📊 Total dashboards loaded: ${dashboards.length}`)

    let filtered: any[] = dashboards as any[]

    if (companyFilter) {
      filtered = filtered.filter((d: any) => d.access?.company?.[companyFilter])
      console.log(`  🔍 After company filter (${companyFilter}): ${filtered.length}`)
    }

    if (query.folderId) {
      filtered = filtered.filter((d: any) => d.folderId === query.folderId)
      console.log(`  🔍 After folderId filter: ${filtered.length}`)
    }

    console.log(`  ✅ Returning: ${filtered.length} dashboards`)
    return { success: true, data: filtered, total: filtered.length }
  } catch (error: any) {
    console.error('[API] Error fetching dashboards:', error.message)
    throw createError({
      statusCode: 500,
      message: 'Failed to read dashboards'
    })
  }
})
