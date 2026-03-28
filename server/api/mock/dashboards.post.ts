import { readJSON, createItem, updateItem, findById } from '../../utils/jsonDatabase'
import { logAuditEvent } from '../../utils/auditLog'
import type { User } from '~/types/dashboard'

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

    let result: any
    let auditAction: 'create' | 'edit'

    if (existingDashboard) {
      // Update existing dashboard
      const updated = await updateItem('dashboards.json', body.id, body)
      result = { success: true, data: updated, action: 'updated' }
      auditAction = 'edit'
    } else {
      // Create new dashboard — ensure owner has access
      if (body.owner) {
        if (!body.access) {
          body.access = { direct: { users: [], groups: [] }, company: [] }
        }
        if (!body.access.direct) {
          body.access.direct = { users: [], groups: [] }
        }
        if (!body.access.direct.users) {
          body.access.direct.users = []
        }
        if (!body.access.direct.users.includes(body.owner)) {
          body.access.direct.users.push(body.owner)
        }
      }

      const created = await createItem('dashboards.json', body)
      result = { success: true, data: created, action: 'created' }
      auditAction = 'create'
    }

    // Fire-and-forget audit log
    const auth = event.context.auth
    if (auth?.uid) {
      const userAgent = getHeader(event, 'user-agent') || ''
      const user = await findById<User>('users.json', auth.uid)
      logAuditEvent({
        action: auditAction,
        userId: auth.uid,
        userName: user?.name || auth.name || 'Unknown',
        userEmail: user?.email || auth.email || '',
        company: user?.company || '',
        dashboardId: body.id,
        dashboardName: body.name || body.id,
        userAgent,
      }).catch(() => {})
    }

    return result
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
