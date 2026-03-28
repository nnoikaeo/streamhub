import { readBody } from 'h3'
import { findById, readJSON } from '../../utils/jsonDatabase'
import { checkDashboardAccess, validateCompanyAccess } from '../../utils/companyAccess'
import { createToken } from '../../utils/embedTokenStore'
import { sendForbidden, sendUnauthorized } from '../../utils/apiResponse'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { dashboardId } = body || {}

  if (!dashboardId) {
    throw createError({ statusCode: 400, message: 'dashboardId is required' })
  }

  // Verify user identity
  const uid = event.context.auth?.uid
  if (!uid) {
    return sendUnauthorized(event, 'Authentication required')
  }

  // Validate company access (also loads user record)
  const accessResult = await validateCompanyAccess(event)
  if (!accessResult.allowed) {
    return sendForbidden(event, accessResult.reason)
  }

  const dashboard = await findById('dashboards.json', dashboardId)
  if (!dashboard) {
    throw createError({ statusCode: 404, message: `Dashboard "${dashboardId}" not found` })
  }

  // Check dashboard-level permissions
  const folders = await readJSON('folders.json')
  const access = checkDashboardAccess(dashboard, accessResult.user, folders as any[])
  if (!access.allowed) {
    return sendForbidden(event, access.reason)
  }

  const embedUrl = (dashboard as any).lookerEmbedUrl
  if (!embedUrl) {
    throw createError({ statusCode: 404, message: 'No embed URL configured for this dashboard' })
  }

  const token = createToken(embedUrl, uid)

  return {
    success: true,
    data: {
      token,
      proxyUrl: `/api/embed/${token}`,
    },
  }
})
