import { deleteItem, findById } from '../../../utils/jsonDatabase'
import { logAuditEvent } from '../../../utils/auditLog'
import type { User, Dashboard } from '~/types/dashboard'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    console.log('[API] DELETE /api/mock/dashboards/:id -', id)

    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Dashboard ID is required'
      })
    }

    // Fetch dashboard info before deleting (for audit log name)
    const dashboard = await findById<Dashboard>('dashboards.json', id)

    const deleted = await deleteItem('dashboards.json', id)

    if (!deleted) {
      throw createError({
        statusCode: 404,
        message: `Dashboard with ID "${id}" not found`
      })
    }

    // Fire-and-forget audit log
    const auth = event.context.auth
    if (auth?.uid) {
      const userAgent = getHeader(event, 'user-agent') || ''
      const user = await findById<User>('users.json', auth.uid)
      logAuditEvent({
        action: 'delete',
        userId: auth.uid,
        userName: user?.name || auth.name || 'Unknown',
        userEmail: user?.email || auth.email || '',
        company: user?.company || '',
        dashboardId: id,
        dashboardName: dashboard?.name || id,
        userAgent,
      }).catch(() => {})
    }

    return {
      success: true,
      deleted: true,
      message: `Dashboard "${id}" deleted successfully`
    }
  } catch (error: any) {
    console.error('[API] Error deleting dashboard:', error.message)
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      message: 'Failed to delete dashboard'
    })
  }
})
