import { H3Event, setResponseStatus } from 'h3'

export function sendForbidden(event: H3Event, message: string) {
  setResponseStatus(event, 403)
  return { success: false, error: 'Forbidden', message }
}

export function sendUnauthorized(event: H3Event, message: string) {
  setResponseStatus(event, 401)
  return { success: false, error: 'Unauthorized', message }
}

export function sendNotFound(event: H3Event, message: string) {
  setResponseStatus(event, 404)
  return { success: false, error: 'Not Found', message }
}

export function sendBadRequest(event: H3Event, message: string) {
  setResponseStatus(event, 400)
  return { success: false, error: 'Bad Request', message }
}
