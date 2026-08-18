/**
 * Expiry values on the way OUT to Firestore (BUG-018).
 *
 * `AccessRestrictions.expiry` declares `Date`, but the value that actually
 * reaches a save can be any of three shapes: a `Date` the editor just built, an
 * ISO string (the permissions page deep-clones its state through JSON, which
 * turns every `Date` into a string), or a serialized Timestamp that came back
 * from a read. Writing that straight through is how the same field ended up
 * holding ISO strings from one page and `Timestamp`s from another.
 *
 * Every write goes through here so the stored shape is always `Timestamp`,
 * whatever the caller happened to be holding.
 *
 * The Timestamp constructor is injected rather than imported so this stays a
 * pure function the tests can exercise without the Firebase SDK.
 */

/**
 * Convert an expiry map to whatever `toTimestamp` produces.
 *
 * Unreadable values are dropped rather than written: an expiry that cannot be
 * parsed would either reject the whole `updateDoc` or land as a value the read
 * path treats as "not expired", silently granting access forever. Dropping it
 * leaves the grant with no expiry, which is visible in the UI.
 *
 * @param expiry map of uid to stored expiry value, in any of its shapes
 * @param toTimestamp builder for the stored type — `Timestamp.fromDate` in the app
 * @returns a new map; the input is never mutated
 */
export function toExpiryTimestamps<T>(
  expiry: Record<string, unknown> | undefined,
  toTimestamp: (date: Date) => T,
): Record<string, T> {
  const out: Record<string, T> = {}
  if (!expiry) return out

  for (const [uid, value] of Object.entries(expiry)) {
    const date = toDate(value)
    if (!date) {
      console.warn(`⚠️ [expiryWrite] dropping unreadable expiry for ${uid}:`, value)
      continue
    }
    out[uid] = toTimestamp(date)
  }

  return out
}
