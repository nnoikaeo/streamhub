import { H3Event, getRequestURL, getHeader, getQuery } from 'h3'
import { verifyIdToken, isFirebaseAdminAvailable } from '../utils/firebaseAdmin'
import { sendUnauthorized } from '../utils/apiResponse'

/**
 * Routes that require authentication.
 * All /api/mock/* and /api/looker/* routes are protected.
 * /api/invitations/* are the Firestore-native invitation handlers (production).
 */
const PROTECTED_PREFIXES = ['/api/mock/', '/api/looker/', '/api/embed/request', '/api/audit', '/api/invitations', '/api/health']

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

  // ─── DEV MODE: single early-return block ───
  // In development, allow uid query param as auth fallback.
  // This entire block is dead code in production builds (process.dev is false at build time).
  if (process.dev) {
    const query = getQuery(event)
    const uid = query.uid as string
    const authHeader = getHeader(event, 'authorization')

    // If Bearer token is provided in dev, still try to verify it
    if (authHeader?.startsWith('Bearer ') && isFirebaseAdminAvailable()) {
      const token = authHeader.slice(7)
      const decodedToken = await verifyIdToken(token)
      if (decodedToken) {
        event.context.auth = {
          uid: decodedToken.uid,
          email: decodedToken.email || null,
          name: decodedToken.name || null,
          picture: decodedToken.picture || null,
          emailVerified: decodedToken.email_verified || false,
        }
        console.debug(`[auth] DEV verified token: uid=${decodedToken.uid}`)
        return
      }
    }

    // Fallback to uid query param in dev mode
    if (uid) {
      event.context.auth = { uid, email: null, devMode: true }
      console.debug(`[auth] DEV fallback: uid=${uid}`)
    }
    // Allow all requests through in dev mode (handlers check for missing auth)
    return
  }

  // ─── PRODUCTION: strict auth — no fallbacks ───
  const authHeader = getHeader(event, 'authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendUnauthorized(event, 'Missing or invalid Authorization header')
  }

  const token = authHeader.slice(7)
  const decodedToken = await verifyIdToken(token)

  if (!decodedToken) {
    return sendUnauthorized(event, 'Invalid or expired token')
  }

  event.context.auth = {
    uid: decodedToken.uid,
    email: decodedToken.email || null,
    name: decodedToken.name || null,
    picture: decodedToken.picture || null,
    emailVerified: decodedToken.email_verified || false,
  }
})
