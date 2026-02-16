import { readJSON, createItem, updateItem } from '~/server/utils/jsonDatabase'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    console.log('[API] POST /api/mock/dashboards -', body)

    // Validate required fields
    if (!body.id) {
      throw createError({
        statusCode: 400,
        message: 'Dashboard id is required'
      })
    }

    // Check if it's create or update
    const dashboards = await readJSON('dashboards.json')
    const existingDashboard = dashboards.find((d: any) => d.id === body.id)

    if (existingDashboard) {
      // Update existing dashboard
      const updated = await updateItem('dashboards.json', body.id, body)
      return {
        success: true,
        data: updated,
        action: 'updated'
      }
    } else {
      // Create new dashboard
      const created = await createItem('dashboards.json', body)
      return {
        success: true,
        data: created,
        action: 'created'
      }
    }
  } catch (error: any) {
    console.error('[API] Error creating/updating dashboard:', error.message)
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to create/update dashboard'
    })
  }
})
