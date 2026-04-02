import { H3Event, getRequestURL, getHeader, getQuery } from 'h3'
import { verifyIdToken, isFirebaseAdminAvailable } from '../utils/firebaseAdmin'
import { sendUnauthorized } from '../utils/apiResponse'

/**
 * Routes that require authentication.
 * All /api/mock/* and /api/looker/* routes are protected.
 * /api/invitations/* are the Firestore-native invitation handlers (production).
 */
const PROTECTED_PREFIXES = ['/api/mock/', '/api/looker/', '/api/embed/request', '/api/audit', '/api/invitations/']

/**
 * Routes to skip auth even if they match protected prefixes.
 * Used for public endpoints like invitation verification.
 */
const PUBLIC_ROUTES = [
  '/api/mock/invitations/check',
  '/api/mock/invitations/verify',
  '/api/mock/invitations/accept',
  '/api/invitations/check',
  '/api/invitations/verify',
  '/api/invitations/accept',
]

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route))
}

export default defineEventHandler(async (event: H3Event) => {
  const url = getRequestURL(event)
  const pathname = url.pathname

  // Only apply auth to protected API routes
  if (!isProtectedRoute(pathname)) {
    return
  }

  // Skip auth for explicitly public routes
  if (isPublicRoute(pathname)) {
    return
  }

  console.log(`🔐 [auth.middleware] Processing: ${pathname}`)
  console.log(`🔐 [auth.middleware] isDev: ${process.dev}, firebaseAdminAvailable: ${isFirebaseAdminAvailable()}`)

  // --- DEV MODE FALLBACK ---
  // In development, if Firebase Admin is not available (no credentials),
  // fall back to uid from query param for backward compatibility with mock API.
  if (process.dev && !isFirebaseAdminAvailable()) {
    const query = getQuery(event)
    const uid = query.uid as string
    console.log(`🔐 [auth.middleware] DEV fallback (no Admin SDK) — uid from query: ${uid || '(none)'}`)

    if (uid) {
      event.context.auth = { uid, email: null, devMode: true }
      console.log(`🔐 [auth.middleware] ✅ Auth set via DEV fallback: uid=${uid}`)
    } else {
      console.log(`🔐 [auth.middleware] ⚠️ No uid in query — auth will be undefined`)
    }
    // In dev mode without credentials, allow requests through even without uid
    // (backward compatible — existing handlers already handle missing uid)
    return
  }

  // --- TOKEN VERIFICATION ---
  const authHeader = getHeader(event, 'authorization')
  console.log(`🔐 [auth.middleware] Authorization header present: ${!!authHeader}, starts with Bearer: ${authHeader?.startsWith('Bearer ')}`)

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // In dev mode with credentials available, still allow fallback to query uid
    if (process.dev) {
      const query = getQuery(event)
      const uid = query.uid as string
      console.log(`🔐 [auth.middleware] No Bearer token in DEV — uid from query: ${uid || '(none)'}`)
      if (uid) {
        event.context.auth = { uid, email: null, devMode: true }
        console.log(`🔐 [auth.middleware] ✅ Auth set via DEV query fallback: uid=${uid}`)
      }
      return
    }

    console.log(`🔐 [auth.middleware] ❌ Returning 401 — Missing or invalid Authorization header`)
    return sendUnauthorized(event, 'Missing or invalid Authorization header')
  }

  const token = authHeader.slice(7) // Remove 'Bearer '
  console.log(`🔐 [auth.middleware] Token extracted, length: ${token.length}`)

  const decodedToken = await verifyIdToken(token)
  console.log(`🔐 [auth.middleware] Token verification result: ${decodedToken ? 'SUCCESS uid=' + decodedToken.uid : 'FAILED'}`)

  if (!decodedToken) {
    // In dev mode, allow fallback even if token verification fails
    if (process.dev) {
      const query = getQuery(event)
      const uid = query.uid as string
      console.log(`🔐 [auth.middleware] Token verify failed in DEV — uid from query: ${uid || '(none)'}`)
      if (uid) {
        event.context.auth = { uid, email: null, devMode: true }
        console.log(`🔐 [auth.middleware] ✅ Auth set via DEV fallback after token fail: uid=${uid}`)
      } else {
        console.log(`🔐 [auth.middleware] ⚠️ No uid fallback — auth will be undefined`)
      }
      return
    }

    console.log(`🔐 [auth.middleware] ❌ Returning 401 — Invalid or expired token`)
    return sendUnauthorized(event, 'Invalid or expired token')
  }

  // Set auth context for downstream handlers
  event.context.auth = {
    uid: decodedToken.uid,
    email: decodedToken.email || null,
    name: decodedToken.name || null,
    picture: decodedToken.picture || null,
    emailVerified: decodedToken.email_verified || false,
  }
  console.log(`🔐 [auth.middleware] ✅ Auth set via verified token: uid=${decodedToken.uid}, email=${decodedToken.email}`)
})
