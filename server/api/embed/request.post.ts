import { readBody, setCookie } from 'h3'
import { findById, readJSON } from '../../utils/jsonDatabase'
import { checkDashboardAccess, validateCompanyAccess } from '../../utils/companyAccess'
import {
  createEmbedToken,
  resolveEmbedSecret,
  createEmbedSession,
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
} from '../../utils/embedToken'
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

  const embedTokenSecret = resolveEmbedSecret(useRuntimeConfig(event).embedTokenSecret)
  if (!embedTokenSecret) {
    throw createError({ statusCode: 500, message: 'Embed tokens are not configured' })
  }

  const token = createEmbedToken(embedUrl, uid, embedTokenSecret)

  // Bind the token to this browser. `GET /api/embed/{token}` is an iframe
  // navigation and carries no Authorization header, so the cookie is the only
  // identity it can check the token against. `__session` because that is the
  // one cookie name Firebase Hosting forwards to Cloud Functions.
  setCookie(event, SESSION_COOKIE_NAME, createEmbedSession(uid, embedTokenSecret), {
    httpOnly: true,
    // Localhost dev runs over plain HTTP, where a Secure cookie is dropped.
    secure: !import.meta.dev,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  })

  return {
    success: true,
    data: {
      token,
      proxyUrl: `/api/embed/${token}`,
    },
  }
})
