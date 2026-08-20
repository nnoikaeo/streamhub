import type { H3Event } from 'h3'
import { getRequestURL, setHeader } from 'h3'

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
  // Firebase Auth loads a helper iframe from whatever `authDomain` is
  // configured, so that origin has to be allowed to be framed. The list used
  // to hardcode `*.firebaseapp.com`, which was only ever correct by accident:
  // on production authDomain is the site's own origin, so `'self'` covered it,
  // and locally authDomain used to be a firebaseapp.com address. Point the
  // dev server at an .env with `authDomain=…web.app` and the iframe is blocked
  // — auth still works through the popup, but the console fills with CSP
  // violations and cross-tab state sync loses its channel. Derive the origin
  // instead of naming one. (firebase.json carries a static copy of this header
  // for assets Hosting serves directly; it cannot read runtime config, and on
  // production `'self'` already covers the authDomain, so it is left as is.)
  const authDomain = useRuntimeConfig(event).public.firebase.authDomain
  const authFrameSrc = authDomain && !authDomain.startsWith('YOUR_') ? ` https://${authDomain}` : ''
  setHeader(
    event,
    'Content-Security-Policy',
    "frame-src 'self' https://lookerstudio.google.com https://datastudio.google.com " +
      `https://*.firebaseapp.com https://*.googleapis.com${authFrameSrc}; frame-ancestors 'self'`
  )

  const pathname = getRequestURL(event).pathname

  // SPA HTML responses (non-API routes) must never be cached — after each
  // deploy Vite generates new content-hashed JS bundles. A stale index.html
  // referencing old hashes causes "MIME type mismatch" errors because the
  // old JS files no longer exist in Firebase Hosting and the Cloud Function
  // returns an HTML fallback instead.
  if (!pathname.startsWith('/api/')) {
    setHeader(event, 'Cache-Control', 'no-cache, no-store, must-revalidate')
  }

  // Cache control for auth-gated mock API — never cache at CDN
  if (pathname.startsWith('/api/mock/')) {
    setHeader(event, 'Cache-Control', 'no-store')
  }
})
