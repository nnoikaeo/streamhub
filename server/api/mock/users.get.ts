import { readJSON } from '../../utils/jsonDatabase'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    console.log('[API] GET /api/mock/users')
    console.log('  📥 Query params:', query)

    const uid = query.uid as string
    const companyFilter = query.company as string

    // If requester uid provided: validate access and filter by company
    if (uid) {
      const accessResult = await validateCompanyAccess(event, companyFilter)
      if (!accessResult.allowed) {
        return sendForbidden(event, accessResult.reason)
      }

      const users = await readJSON('users.json')
      let filtered: any[] = users as any[]

      if (accessResult.user.role !== 'admin') {
        // Non-admin: only own company
        filtered = filtered.filter((u: any) => u.company === accessResult.user.company)
      } else if (companyFilter) {
        // Admin with company filter
        filtered = filtered.filter((u: any) => u.company === companyFilter)
      }

      console.log(`  👥 Returning: ${filtered.length} users`)
      return { success: true, data: filtered }
    }

    // Fallback: no uid (admin pages, backward compatible)
    const users = await readJSON('users.json')
    let filtered: any[] = users as any[]

    if (companyFilter) {
      filtered = filtered.filter((u: any) => u.company === companyFilter)
    }

    console.log(`  👥 Total users: ${filtered.length}`)
    return { success: true, data: filtered }
  } catch (error: any) {
    console.error('[API] Error fetching users:', error.message)
    throw createError({
      statusCode: 500,
      message: 'Failed to read users'
    })
  }
})
