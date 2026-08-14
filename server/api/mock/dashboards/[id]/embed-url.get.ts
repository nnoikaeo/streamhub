import { findById, readJSON } from '../../../../utils/jsonDatabase'
import type { Dashboard, Folder } from '~/types/dashboard'

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

    const dashboard = await findById<Dashboard>('dashboards.json', id)

    if (!dashboard) {
      throw createError({
        statusCode: 404,
        message: `Dashboard with ID "${id}" not found`,
      })
    }

    const folders = await readJSON<Folder>('folders.json')
    const access = checkDashboardAccess(dashboard, accessResult.user, folders)
    if (!access.allowed) {
      return sendForbidden(event, access.reason)
    }

    return {
      success: true,
      data: {
        embedUrl: dashboard.lookerEmbedUrl || null,
      },
    }
  } catch (error: unknown) {
    console.error('[API] Error fetching embed URL:', getErrorMessage(error))
    if (getErrorStatus(error)) throw error
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch embed URL',
    })
  }
})
