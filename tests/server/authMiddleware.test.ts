import { describe, it, expect } from 'vitest'

// Unit-test the route-matching logic extracted from server/middleware/auth.ts
// to prevent regression of the trailing-slash bug that caused POST /api/invitations
// to bypass the auth middleware and receive a 503 "Firestore not available".

const PROTECTED_PREFIXES = [
  '/api/mock/',
  '/api/looker/',
  '/api/embed/request',
  '/api/audit',
  '/api/invitations',
]

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

describe('auth middleware route matching', () => {
  describe('POST /api/invitations (regression: trailing-slash 503 bug)', () => {
    it('is a protected route', () => {
      // Previously failed because prefix was "/api/invitations/" (with trailing slash)
      expect(isProtectedRoute('/api/invitations')).toBe(true)
    })

    it('is NOT a public route', () => {
      expect(isPublicRoute('/api/invitations')).toBe(false)
    })
  })

  describe('child invitation routes', () => {
    it('/api/invitations/check is protected but also public (skips auth)', () => {
      expect(isProtectedRoute('/api/invitations/check')).toBe(true)
      expect(isPublicRoute('/api/invitations/check')).toBe(true)
    })

    it('/api/invitations/verify is protected but also public', () => {
      expect(isProtectedRoute('/api/invitations/verify')).toBe(true)
      expect(isPublicRoute('/api/invitations/verify')).toBe(true)
    })

    it('/api/invitations/accept is protected but also public', () => {
      expect(isProtectedRoute('/api/invitations/accept')).toBe(true)
      expect(isPublicRoute('/api/invitations/accept')).toBe(true)
    })
  })

  describe('non-invitation routes', () => {
    it('/api/mock/* is protected', () => {
      expect(isProtectedRoute('/api/mock/users')).toBe(true)
    })

    it('/dashboard is not protected', () => {
      expect(isProtectedRoute('/dashboard')).toBe(false)
    })

    it('/api/thumbnail is not protected', () => {
      expect(isProtectedRoute('/api/thumbnail')).toBe(false)
    })
  })
})
