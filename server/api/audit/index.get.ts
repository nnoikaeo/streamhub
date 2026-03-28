import { H3Event, getQuery } from 'h3'
import { queryAuditLogs, getAuditSummary, type AuditAction } from '../../utils/auditLog'
import { sendForbidden, sendUnauthorized } from '../../utils/apiResponse'
import { findById } from '../../utils/jsonDatabase'
import type { User } from '~/types/dashboard'

export default defineEventHandler(async (event: H3Event) => {
  const auth = event.context.auth
  console.log(`📋 [audit.get] auth context:`, JSON.stringify(auth))

  if (!auth?.uid) {
    console.log(`📋 [audit.get] ❌ Returning 401 — no auth.uid`)
    return sendUnauthorized(event, 'Authentication required')
  }

  // Admin only
  const user = await findById<User>('users.json', auth.uid)
  console.log(`📋 [audit.get] User lookup for uid=${auth.uid}:`, user ? `found (role=${user.role})` : 'NOT FOUND')
  if (!user || user.role !== 'admin') {
    console.log(`📋 [audit.get] ❌ Returning 403 — not admin`)
    return sendForbidden(event, 'Admin access required')
  }

  const query = getQuery(event)

  // If requesting summary stats
  if (query.summary === 'true') {
    const summary = await getAuditSummary()
    return { success: true, ...summary }
  }

  // Query logs with filters + pagination
  const result = await queryAuditLogs({
    action: query.action as AuditAction | undefined,
    userId: query.userId as string | undefined,
    company: query.company as string | undefined,
    dashboardId: query.dashboardId as string | undefined,
    dateFrom: query.dateFrom as string | undefined,
    dateTo: query.dateTo as string | undefined,
    search: query.search as string | undefined,
    page: query.page ? Number(query.page) : 1,
    limit: query.limit ? Number(query.limit) : 25,
  })

  return { success: true, ...result }
})
