/**
 * Error narrowing helpers.
 *
 * A caught value is `unknown`: it may be an `Error`, an H3 error from
 * `createError()`, an ofetch `FetchError`, a Firebase error, or a bare string.
 * These read the fields we actually rely on without widening the `catch`
 * binding back to `any`.
 *
 * Auto-imported in both `app/` and `server/`. Scripts outside the Nuxt build
 * import from `../shared/utils/errors` directly.
 */

/** Read a thrown value as a plain record so optional fields can be probed safely. */
function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : {}
}

/** Keep a value only when it is a non-empty string. */
function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

/**
 * HTTP status carried by a thrown error.
 *
 * H3's `statusCode` wins, then ofetch's `response.status`, then a plain
 * `status`. ofetch's `FetchError` exposes all three with the same value, so the
 * order only matters for foreign error shapes.
 */
export function getErrorStatus(error: unknown): number | undefined {
  const record = asRecord(error)
  if (typeof record.statusCode === 'number') return record.statusCode

  const responseStatus = asRecord(record.response).status
  if (typeof responseStatus === 'number') return responseStatus

  return typeof record.status === 'number' ? record.status : undefined
}

/** Message from an H3 / ofetch error payload (`error.data.message`). */
export function getErrorDataMessage(error: unknown): string | undefined {
  return asString(asRecord(asRecord(error).data).message)
}

/**
 * Human-readable message for a thrown value. Always returns a string, unlike a
 * bare `error.message`, which is `undefined` on anything that is not an `Error`.
 */
export function getErrorMessage(error: unknown, fallback = 'Unknown error'): string {
  if (error instanceof Error && error.message) return error.message

  const record = asRecord(error)
  return (
    asString(record.message)
    ?? asString(record.statusMessage)
    ?? getErrorDataMessage(error)
    ?? asString(error)
    ?? fallback
  )
}

/** Provider error code, e.g. Firebase Auth's `auth/popup-closed-by-user`. */
export function getErrorCode(error: unknown): string | undefined {
  return asString(asRecord(error).code)
}

/** Coerce a thrown value to a real `Error`, for state typed `Error | null`. */
export function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(getErrorMessage(error))
}
