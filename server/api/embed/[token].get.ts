import { getCookie, sendRedirect } from 'h3'
import {
  verifyEmbedToken,
  verifyEmbedSession,
  resolveEmbedSecret,
  SESSION_COOKIE_NAME,
} from '../../utils/embedToken'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')

  if (!token) {
    throw createError({ statusCode: 400, message: 'Token is required' })
  }

  const embedTokenSecret = resolveEmbedSecret(useRuntimeConfig(event).embedTokenSecret)
  const payload = verifyEmbedToken(token, embedTokenSecret)

  if (!payload) {
    throw createError({ statusCode: 403, message: 'Invalid or expired token' })
  }

  // This route is not in the auth middleware's PROTECTED_PREFIXES — an iframe
  // navigation cannot send a Bearer token — so the session cookie set at mint
  // time is what proves the token is being redeemed by the user it was minted
  // for. Without it a leaked token would work in anyone's browser.
  const session = verifyEmbedSession(getCookie(event, SESSION_COOKIE_NAME), embedTokenSecret)
  if (!session || session.uid !== payload.uid) {
    throw createError({ statusCode: 403, message: 'Invalid or expired token' })
  }

  return sendRedirect(event, payload.embedUrl, 302)
})
