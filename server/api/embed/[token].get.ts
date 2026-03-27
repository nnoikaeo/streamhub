import { sendRedirect } from 'h3'
import { consumeToken } from '../../utils/embedTokenStore'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')

  if (!token) {
    throw createError({ statusCode: 400, message: 'Token is required' })
  }

  const embedUrl = consumeToken(token)

  if (!embedUrl) {
    throw createError({ statusCode: 403, message: 'Invalid or expired token' })
  }

  return sendRedirect(event, embedUrl, 302)
})
