import { H3Event, readBody, getHeader } from 'h3'
import { logAuditEvent, type AuditAction } from '../../utils/auditLog'
import { sendBadRequest, sendUnauthorized } from '../../utils/apiResponse'
import { findById } from '../../utils/jsonDatabase'
import { resolveUser } from '../../utils/resolveUserRole'
import type { Dashboard } from '~/types/dashboard'

const VALID_ACTIONS: AuditAction[] = ['view', 'edit', 'archive', 'create', 'delete', 'denied']

export default defineEventHandler(async (event: H3Event) => {
  const auth = event.context.auth
  if (!auth?.uid) {
    return sendUnauthorized(event, 'Authentication required')
  }

  const body = await readBody(event)
  const { dashboardId, action, dashboardName } = body || {}

  if (!dashboardId || !action) {
    return sendBadRequest(event, 'dashboardId and action are required')
  }

  if (!VALID_ACTIONS.includes(action)) {
    return sendBadRequest(event, `Invalid action. Must be one of: ${VALID_ACTIONS.join(', ')}`)
  }

  // Resolve user info — dual-mode (Firestore in prod, JSON in dev/mock)
  const user = await resolveUser(auth.uid)
  const userName = user?.name || auth.name || 'Unknown'
  const userEmail = user?.email || auth.email || ''
  const company = user?.company || ''

  // Resolve dashboard name if not provided
  let resolvedDashboardName = dashboardName || ''
  if (!resolvedDashboardName && dashboardId) {
    const dashboard = await findById<Dashboard>('dashboards.json', dashboardId)
    resolvedDashboardName = dashboard?.name || dashboardId
  }

  const userAgent = getHeader(event, 'user-agent') || ''

  const logged = await logAuditEvent({
    action,
    userId: auth.uid,
    userName,
    userEmail,
    company,
    dashboardId,
    dashboardName: resolvedDashboardName,
    userAgent,
  })

  return { success: true, logged }
})
