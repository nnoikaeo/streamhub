/**
 * Date coercion helpers.
 *
 * The same stored value reaches us in three shapes, and the type declarations
 * can only name one of them:
 *
 * - `AccessRestrictions.expiry` declares `Date`
 * - the JSON store holds ISO strings (`.data/*.json`)
 * - Firestore holds `Timestamp` for values written before Quick Share was
 *   removed, and the SDK reads them back as a `Timestamp` object (or as
 *   `{ seconds, nanoseconds }` once it has been through JSON); the permissions
 *   page writes ISO strings instead — see BUG-018
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
 * Read a date-only string (`YYYY-MM-DD`, what `<input type="date">` produces)
 * as the END of that day in the viewer's own timezone — 23:59:59.999 local.
 *
 * `new Date('2026-08-17')` parses as midnight **UTC**, which is 07:00 in
 * Bangkok: a grant the user set to expire "on the 17th" would cut out on the
 * morning of the 17th, 17 hours early. A date-only picker implies the chosen
 * day is the last full day of access, so the end of that local day is the
 * instant to store.
 *
 * No caller yet: Quick Share, which used to call it, was removed. It is kept
 * (with its tests) because it is the intended fix for BUG-018 — the permissions
 * page still writes midnight UTC.
 *
 * @returns the `Date`, or `null` when the value is absent, malformed, or names
 *   a day that does not exist (`2026-02-31`) — never an `Invalid Date`, and
 *   never a silently rolled-over month.
 */
export function endOfDayLocal(value: string | null | undefined): Date | null {
  if (!value) return null

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
  if (!match) return null

  const [, year, month, day] = match
  if (!year || !month || !day) return null

  const y = Number(year)
  const m = Number(month)
  const d = Number(day)
  const date = new Date(y, m - 1, d, 23, 59, 59, 999)

  // Reject a day the calendar rolled over (new Date(2026, 1, 31) → 3 March)
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
    return null
  }

  return date
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
