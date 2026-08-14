import { readJSON } from '../../utils/jsonDatabase'
import type { User } from '~/types/dashboard'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    console.log('[API] GET /api/mock/users')
    console.log('  📥 Query params:', query)

    // Use verified auth context (from middleware) first, fallback to query param
    const uid = event.context.auth?.uid || (query.uid as string)
    const companyFilter = query.company as string

    // If requester uid provided: validate access and filter by company
    if (uid) {
      const accessResult = await validateCompanyAccess(event, companyFilter)
      if (!accessResult.allowed) {
        return sendForbidden(event, accessResult.reason)
      }

      const users = await readJSON<User>('users.json')
      let filtered = users

      if (accessResult.user.role !== 'admin') {
        // Non-admin: only own company
        filtered = filtered.filter((u) => u.company === accessResult.user.company)
      } else if (companyFilter) {
        // Admin with company filter
        filtered = filtered.filter((u) => u.company === companyFilter)
      }

      console.log(`  👥 Returning: ${filtered.length} users`)
      return { success: true, data: filtered }
    }

    // Fallback: no uid (admin pages, backward compatible)
    const users = await readJSON<User>('users.json')
    let filtered = users

    if (companyFilter) {
      filtered = filtered.filter((u) => u.company === companyFilter)
    }

    console.log(`  👥 Total users: ${filtered.length}`)
    return { success: true, data: filtered }
  } catch (error: unknown) {
    console.error('[API] Error fetching users:', getErrorMessage(error))
    throw createError({
      statusCode: 500,
      message: 'Failed to read users'
    })
  }
})
