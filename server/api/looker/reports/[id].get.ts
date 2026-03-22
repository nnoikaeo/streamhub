/**
 * GET /api/looker/reports/:id
 * Get metadata for a single Looker Studio report
 */
export default defineEventHandler(async (event) => {
  if (!isLookerApiEnabled(event)) {
    return { success: false, enabled: false, message: 'Looker API not configured' }
  }

  const reportId = getRouterParam(event, 'id')
  if (!reportId) {
    return sendBadRequest(event, 'Report ID is required')
  }

  const report = await getLookerReport(event, reportId)
  if (!report) {
    return sendNotFound(event, 'Report not found')
  }

  return { success: true, data: report }
})
