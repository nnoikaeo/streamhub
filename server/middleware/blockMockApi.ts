import { getRequestURL, createError, sendError } from 'h3'

/**
 * Block all /api/mock/* endpoints in production builds.
 * Mock API is for local development only — production must use Firestore.
 */
export default defineEventHandler((event) => {
  if (!import.meta.dev && getRequestURL(event).pathname.startsWith('/api/mock/')) {
    return sendError(event, createError({ statusCode: 404, message: 'Not Found' }))
  }
})
