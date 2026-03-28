import { findById, readJSON } from '../../../../utils/jsonDatabase'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Dashboard ID is required',
      })
    }

    // Validate company access (gets uid from query params — consistent with other mock endpoints)
    const accessResult = await validateCompanyAccess(event)
    if (!accessResult.allowed) {
      return sendForbidden(event, accessResult.reason)
    }

    const dashboard = await findById('dashboards.json', id)

    if (!dashboard) {
      throw createError({
        statusCode: 404,
        message: `Dashboard with ID "${id}" not found`,
      })
    }

    const folders = await readJSON('folders.json')
    const access = checkDashboardAccess(dashboard, accessResult.user, folders as any[])
    if (!access.allowed) {
      return sendForbidden(event, access.reason)
    }

    return {
      success: true,
      data: {
        embedUrl: (dashboard as any).lookerEmbedUrl || null,
      },
    }
  } catch (error: any) {
    console.error('[API] Error fetching embed URL:', error.message)
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch embed URL',
    })
  }
})
