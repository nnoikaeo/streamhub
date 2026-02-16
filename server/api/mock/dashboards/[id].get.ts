import { findById } from '../../../utils/jsonDatabase'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
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

    return {
      success: true,
      data: dashboard
    }
  } catch (error: any) {
    console.error('[API] Error fetching dashboard:', error.message)
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      message: 'Failed to read dashboard'
    })
  }
})
