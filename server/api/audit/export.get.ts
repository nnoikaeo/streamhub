import { H3Event, getQuery, setResponseHeader } from 'h3'
import { queryAuditLogs, type AuditAction } from '../../utils/auditLog'
import { sendForbidden, sendUnauthorized } from '../../utils/apiResponse'
import { findById } from '../../utils/jsonDatabase'
import type { User } from '~/types/dashboard'

export default defineEventHandler(async (event: H3Event) => {
  const auth = event.context.auth
  if (!auth?.uid) {
    return sendUnauthorized(event, 'Authentication required')
  }

  // Admin only
  const user = await findById<User>('users.json', auth.uid)
  if (!user || user.role !== 'admin') {
    return sendForbidden(event, 'Admin access required')
  }

  const query = getQuery(event)

  // Fetch all matching logs (no pagination limit for export)
  const result = await queryAuditLogs({
    action: query.action as AuditAction | undefined,
    userId: query.userId as string | undefined,
    company: query.company as string | undefined,
    dashboardId: query.dashboardId as string | undefined,
    dateFrom: query.dateFrom as string | undefined,
    dateTo: query.dateTo as string | undefined,
    search: query.search as string | undefined,
    page: 1,
    limit: 100000, // Export all matching
  })

  // Build CSV
  const headers = ['Timestamp', 'Action', 'Level', 'User Name', 'Email', 'Company', 'Dashboard', 'Dashboard ID']
  const rows = result.items.map(entry => [
    entry.timestamp,
    entry.action,
    entry.level,
    entry.userName,
    entry.userEmail,
    entry.company,
    entry.dashboardName,
    entry.dashboardId,
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')),
  ].join('\n')

  // Set response headers for CSV download
  const filename = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`
  setResponseHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
  setResponseHeader(event, 'Content-Disposition', `attachment; filename="${filename}"`)

  // Add BOM for Excel UTF-8 compatibility
  return '\uFEFF' + csvContent
})
