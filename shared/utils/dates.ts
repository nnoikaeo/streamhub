/**
 * Date coercion helpers.
 *
 * The same stored value reaches us in three shapes, and the type declarations
 * can only name one of them:
 *
 * - `AccessRestrictions.expiry` declares `Date`
 * - the JSON store holds ISO strings (`.data/*.json`)
 * - Firestore holds `Timestamp` — `quickShareDashboard` writes
 *   `Timestamp.fromDate(...)`, and the SDK reads it back as a `Timestamp`
 *   object (or as `{ seconds, nanoseconds }` once it has been through JSON)
 *
 * `new Date(timestamp)` on the last shape yields `Invalid Date`, which then
 * compares `false` against everything — an expiry that silently never fires.
 * These helpers read all three instead.
 *
 * Auto-imported in both `app/` and `server/`.
 */

/** Read a value as a plain record so optional fields can be probed safely. */
function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : {}
}

/**
 * Coerce a stored date value to a real `Date`.
 *
 * Accepts a `Date`, an ISO string, an epoch number, a Firestore `Timestamp`
 * (via its `toDate()` method), or a serialized Timestamp
 * (`{ seconds, nanoseconds }` / `{ _seconds, _nanoseconds }`).
 *
 * @returns the `Date`, or `null` when the value is absent or unparseable —
 *   never an `Invalid Date`, so callers cannot compare against a silent NaN.
 */
export function toDate(value: unknown): Date | null {
  if (value === null || value === undefined) return null

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  const record = asRecord(value)

  // Firestore Timestamp — client and admin SDK both expose toDate()
  if (typeof record.toDate === 'function') {
    const converted = (record.toDate as () => unknown)()
    return converted instanceof Date && !Number.isNaN(converted.getTime())
      ? converted
      : null
  }

  // Timestamp that has been through JSON — the methods are gone, seconds remain
  const seconds = record.seconds ?? record._seconds
  if (typeof seconds === 'number') {
    const parsed = new Date(seconds * 1000)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  return null
}

/**
 * Whether a stored expiry has passed.
 *
 * Unset and unparseable values are NOT expired — an unreadable expiry must not
 * lock a user out of a dashboard they were granted. Only a date that resolves
 * and lies in the past denies access.
 */
export function isExpired(value: unknown, now: Date = new Date()): boolean {
  const expiry = toDate(value)
  return expiry !== null && expiry.getTime() < now.getTime()
}
