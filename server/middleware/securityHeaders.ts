import { H3Event, getRequestURL, setHeader } from 'h3'

/**
 * Server middleware that sets security headers on every response.
 *
 * Moved out of nuxt.config.ts `routeRules` because the Firebase preset +
 * SPA mode cannot serialise complex header objects for the client-side
 * route-rule matcher — it throws:
 *   "Cannot read properties of undefined (reading 'entries')"
 */
export default defineEventHandler((event: H3Event) => {
  // Security headers — applied to all responses
  setHeader(event, 'X-Frame-Options', 'SAMEORIGIN')
  setHeader(event, 'Referrer-Policy', 'strict-origin')
  setHeader(event, 'X-Content-Type-Options', 'nosniff')
  setHeader(
    event,
    'Content-Security-Policy',
    "frame-src 'self' https://lookerstudio.google.com https://datastudio.google.com https://*.firebaseapp.com https://*.googleapis.com; frame-ancestors 'self'"
  )

  // Cache control for auth-gated mock API — never cache at CDN
  const pathname = getRequestURL(event).pathname
  if (pathname.startsWith('/api/mock/')) {
    setHeader(event, 'Cache-Control', 'no-store')
  }
})
