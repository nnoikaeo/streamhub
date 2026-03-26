import { findById, readJSON } from '../../../utils/jsonDatabase'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    const query = getQuery(event)
    console.log('[API] GET /api/mock/dashboards/:id -', id)

    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Dashboard ID is required'
      })
    }

    const dashboard = await findById('dashboards.json', id)

    if (!dashboard) {
      throw createError({
        statusCode: 404,
        message: `Dashboard with ID "${id}" not found`
      })
    }

    // Use verified auth context (from middleware) first, fallback to query param
    const uid = event.context.auth?.uid || (query.uid as string)
    if (uid) {
      const accessResult = await validateCompanyAccess(event)
      if (!accessResult.allowed) {
        return sendForbidden(event, accessResult.reason)
      }

      const folders = await readJSON('folders.json')
      const access = checkDashboardAccess(dashboard, accessResult.user, folders as any[])
      if (!access.allowed) {
        return sendForbidden(event, access.reason)
      }
    }

    // Strip lookerEmbedUrl from response (security: use /embed-url endpoint instead)
    const { lookerEmbedUrl, ...sanitized } = dashboard as any

    return { success: true, data: sanitized }
  } catch (error: any) {
    console.error('[API] Error fetching dashboard:', error.message)
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: 'Failed to read dashboard'
    })
  }
})
