/**
 * POST /api/looker/sync
 * Sync Looker Studio report metadata with local dashboards
 * Updates lookerEmbedUrl for dashboards that have a matching lookerDashboardId
 */
export default defineEventHandler(async (event) => {
  if (!isLookerApiEnabled(event)) {
    return { success: false, message: 'Looker API not configured' }
  }

  const reports = await searchLookerReports(event)

  const dashboards = await readJSON<Record<string, unknown>>('dashboards')

  let synced = 0
  for (const dashboard of dashboards) {
    if (!dashboard.lookerDashboardId) continue

    const report = reports.find((r) => r.id === dashboard.lookerDashboardId)
    if (report) {
      dashboard.lookerEmbedUrl = report.embedUrl
      dashboard.updatedAt = new Date().toISOString()
      synced++
    }
  }

  if (synced > 0) {
    await writeJSON('dashboards', dashboards)
  }

  return {
    success: true,
    totalReports: reports.length,
    syncedDashboards: synced,
  }
})
