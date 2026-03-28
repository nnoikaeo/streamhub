import { findById, updateItem } from '../../../utils/jsonDatabase'
import { logAuditEvent } from '../../../utils/auditLog'
import type { User, Dashboard } from '~/types/dashboard'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)
    console.log('[API] PUT /api/mock/dashboards/:id -', id)

    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Dashboard ID is required'
      })
    }

    const existing = await findById<Dashboard>('dashboards.json', id)
    if (!existing) {
      throw createError({
        statusCode: 404,
        message: `Dashboard with ID "${id}" not found`
      })
    }

    const updates: Record<string, any> = {}
    const allowedFields = ['name', 'folderId', 'description', 'lookerDashboardId', 'lookerEmbedUrl', 'owner', 'tags', 'isArchived', 'access', 'restrictions']

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field]
      }
    }

    updates.updatedAt = new Date().toISOString()

    const updated = await updateItem('dashboards.json', id, updates)

    // Determine audit action: archive vs generic edit
    const auditAction = (body.isArchived === true && !existing.isArchived) ? 'archive' : 'edit'

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
        dashboardId: id,
        dashboardName: existing.name || id,
        userAgent,
      }).catch(() => {})
    }

    return {
      success: true,
      data: updated
    }
  } catch (error: any) {
    console.error('[API] Error updating dashboard:', error.message)
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: 'Failed to update dashboard'
    })
  }
})
