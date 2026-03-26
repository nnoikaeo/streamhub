import { H3Event, getRequestURL, getHeader, getQuery } from 'h3'
import { verifyIdToken, isFirebaseAdminAvailable } from '../utils/firebaseAdmin'
import { sendUnauthorized } from '../utils/apiResponse'

/**
 * Routes that require authentication.
 * All /api/mock/* and /api/looker/* routes are protected.
 */
const PROTECTED_PREFIXES = ['/api/mock/', '/api/looker/']

/**
 * Routes to skip auth even if they match protected prefixes.
 * Used for public endpoints like invitation verification.
 */
const PUBLIC_ROUTES = [
  '/api/mock/invitations/check',
  '/api/mock/invitations/verify',
  '/api/mock/invitations/accept',
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

  // --- DEV MODE FALLBACK ---
  // In development, if Firebase Admin is not available (no credentials),
  // fall back to uid from query param for backward compatibility with mock API.
  if (process.dev && !isFirebaseAdminAvailable()) {
    const query = getQuery(event)
    const uid = query.uid as string

    if (uid) {
      event.context.auth = { uid, email: null, devMode: true }
    }
    // In dev mode without credentials, allow requests through even without uid
    // (backward compatible — existing handlers already handle missing uid)
    return
  }

  // --- TOKEN VERIFICATION ---
  const authHeader = getHeader(event, 'authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // In dev mode with credentials available, still allow fallback to query uid
    if (process.dev) {
      const query = getQuery(event)
      const uid = query.uid as string
      if (uid) {
        event.context.auth = { uid, email: null, devMode: true }
      }
      return
    }

    return sendUnauthorized(event, 'Missing or invalid Authorization header')
  }

  const token = authHeader.slice(7) // Remove 'Bearer '

  const decodedToken = await verifyIdToken(token)

  if (!decodedToken) {
    // In dev mode, allow fallback even if token verification fails
    if (process.dev) {
      const query = getQuery(event)
      const uid = query.uid as string
      if (uid) {
        event.context.auth = { uid, email: null, devMode: true }
      }
      return
    }

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
})
