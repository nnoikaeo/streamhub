/**
 * Return-path handling for the login redirect (TC 6.1.1).
 *
 * When auth middleware bounces a request to `/login` it carries the page the
 * user was actually trying to reach. That value comes back through the URL, so
 * it is attacker-controlled: a crafted `?returnTo=https://evil.example` would
 * turn our own login into an open redirect. Everything here exists to make sure
 * only a same-app path can survive the round trip.
 */

/** Where a signed-in user lands when there is nothing to return to. */
export const DEFAULT_LANDING = '/dashboard'

/**
 * Paths that must never be a return target: bouncing back to the login page
 * after logging in would loop, and `/` only re-runs the redirect logic.
 */
const NON_RETURNABLE = new Set(['/', '/login'])

/**
 * Decide whether a route deserves a returnTo on the way to `/login`.
 * Query strings matter here — the permission editor is reached as
 * `/admin/permissions?dashboard=<id>`, and dropping the query would land the
 * user on an empty editor.
 */
export function shouldRemember(fullPath: string): boolean {
  const path = fullPath.split('?')[0] ?? ''
  return !NON_RETURNABLE.has(path)
}

/**
 * Reduce whatever arrived in `?returnTo=` to a safe in-app path.
 *
 * Rejects anything that is not a plain absolute path: absolute URLs
 * (`https://evil.example`), scheme-relative ones (`//evil.example`, which the
 * browser treats as absolute), and backslash variants that some parsers
 * normalise into `//`.
 */
export function safeReturnTo(raw: unknown, fallback: string = DEFAULT_LANDING): string {
  if (typeof raw !== 'string') return fallback

  const value = raw.trim()
  if (!value.startsWith('/')) return fallback
  if (value.startsWith('//') || value.startsWith('/\\')) return fallback
  if (!shouldRemember(value)) return fallback

  return value
}
