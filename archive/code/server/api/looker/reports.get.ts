/**
 * GET /api/looker/reports
 * Search/list Looker Studio reports accessible by the service account
 * Query params: ?q=search_term
 */
export default defineEventHandler(async (event) => {
  if (!isLookerApiEnabled(event)) {
    return { success: false, enabled: false, message: 'Looker API not configured', data: [] }
  }

  const query = getQuery(event)
  const searchQuery = query.q as string | undefined

  const reports = await searchLookerReports(event, searchQuery)

  return {
    success: true,
    enabled: true,
    data: reports,
    total: reports.length,
  }
})
