import { readBody } from 'h3'
import { findById, readJSON } from '../../utils/jsonDatabase'
import { checkDashboardAccess, validateCompanyAccess } from '../../utils/companyAccess'
import { createToken } from '../../utils/embedTokenStore'
import { sendForbidden, sendUnauthorized } from '../../utils/apiResponse'
import { isFirestoreMode, getAdminDb, fsReadAll } from '../../utils/firestoreAdmin'
import type { User, Dashboard, Folder } from '~/types/dashboard'

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

  let user: User | null
  let dashboard: Dashboard | null
  let folders: Folder[]

  if (isFirestoreMode()) {
    // --- Firestore path ---
    const db = getAdminDb()
    if (!db) {
      throw createError({ statusCode: 500, message: 'Firestore not available' })
    }

    // Fetch user
    const userDoc = await db.collection('users').doc(uid).get()
    user = userDoc.exists ? ({ ...userDoc.data(), uid: userDoc.id } as User) : null
    if (!user) {
      return sendForbidden(event, 'User not found')
    }
    if (!user.isActive) {
      return sendForbidden(event, 'User is inactive')
    }

    // Fetch dashboard
    const dashDoc = await db.collection('dashboards').doc(dashboardId).get()
    dashboard = dashDoc.exists ? ({ ...dashDoc.data(), id: dashDoc.id } as Dashboard) : null

    // Fetch folders for permission inheritance
    folders = await fsReadAll<Folder>(db, 'folders')
  } else {
    // --- JSON path ---
    const accessResult = await validateCompanyAccess(event)
    if (!accessResult.allowed) {
      return sendForbidden(event, accessResult.reason)
    }
    user = accessResult.user
    dashboard = await findById<Dashboard>('dashboards.json', dashboardId)
    folders = await readJSON<Folder>('folders.json')
  }

  if (!dashboard) {
    throw createError({ statusCode: 404, message: `Dashboard "${dashboardId}" not found` })
  }

  // Check dashboard-level permissions
  const access = checkDashboardAccess(dashboard, user, folders)
  if (!access.allowed) {
    return sendForbidden(event, access.reason)
  }

  const embedUrl = dashboard.lookerEmbedUrl
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
