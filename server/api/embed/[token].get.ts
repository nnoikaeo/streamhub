import { sendRedirect } from 'h3'
import { verifyEmbedToken } from '../../utils/embedToken'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')

  if (!token) {
    throw createError({ statusCode: 400, message: 'Token is required' })
  }

  const { embedTokenSecret } = useRuntimeConfig(event)
  const payload = verifyEmbedToken(token, embedTokenSecret)

  if (!payload) {
    throw createError({ statusCode: 403, message: 'Invalid or expired token' })
  }

  return sendRedirect(event, payload.embedUrl, 302)
})
