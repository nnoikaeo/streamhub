function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash)
}

function escapeXml(str: string): string {
  return str.replace(/[<>&'"]/g, (c) => {
    return ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c] || c)
  })
}

export default defineEventHandler(async (event) => {
  const dashboardId = getRouterParam(event, 'dashboardId')

  if (!dashboardId) {
    return sendNotFound(event, 'Dashboard ID required')
  }

  const dashboard = await findById<{ id: string; name: string }>('dashboards', dashboardId)
  if (!dashboard) {
    return sendNotFound(event, `Dashboard "${dashboardId}" not found`)
  }

  const hue = hashString(dashboard.name) % 360
  const hue2 = (hue + 60) % 360

  const svg = `<svg width="400" height="225" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:hsl(${hue},70%,60%)" />
      <stop offset="100%" style="stop-color:hsl(${hue2},70%,40%)" />
    </linearGradient>
  </defs>
  <rect width="400" height="225" fill="url(#bg)" rx="8"/>
  <rect x="24" y="60" width="352" height="4" rx="2" fill="white" opacity="0.2"/>
  <rect x="24" y="72" width="200" height="4" rx="2" fill="white" opacity="0.15"/>
  <rect x="24" y="96" width="352" height="56" rx="6" fill="white" opacity="0.1"/>
  <text x="200" y="148" text-anchor="middle" fill="white" font-size="15" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="600" opacity="0.95">${escapeXml(dashboard.name)}</text>
  <text x="200" y="170" text-anchor="middle" fill="white" font-size="11" font-family="-apple-system, BlinkMacSystemFont, sans-serif" opacity="0.6">Looker Studio Dashboard</text>
</svg>`

  setResponseHeader(event, 'Content-Type', 'image/svg+xml')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=3600')
  return svg
})
