/**
 * Tests for app/utils/returnTo.ts (TC 6.1.1)
 *
 * Auth middleware bounces an unauthenticated request to `/login?returnTo=…` so
 * the user lands back where they were headed. That value round-trips through
 * the URL, so it is attacker-controlled: the sanitiser is the only thing
 * standing between our login page and an open redirect.
 */

import { describe, it, expect } from 'vitest'
import { safeReturnTo, shouldRemember, DEFAULT_LANDING } from '../../app/utils/returnTo'

describe('shouldRemember', () => {
  it('remembers a protected route the user was actually trying to reach', () => {
    expect(shouldRemember('/admin/permissions')).toBe(true)
    expect(shouldRemember('/dashboard/view/dash_1')).toBe(true)
  })

  it('keeps the query, since the permission editor is addressed by it', () => {
    expect(shouldRemember('/admin/permissions?dashboard=dash_1')).toBe(true)
  })

  it('does not remember the login page itself — that would loop', () => {
    expect(shouldRemember('/login')).toBe(false)
    expect(shouldRemember('/login?returnTo=/admin/users')).toBe(false)
  })

  it('does not remember the index redirect', () => {
    expect(shouldRemember('/')).toBe(false)
  })
})

describe('safeReturnTo', () => {
  it('returns an in-app path unchanged, query included', () => {
    expect(safeReturnTo('/admin/permissions?dashboard=dash_1')).toBe(
      '/admin/permissions?dashboard=dash_1'
    )
  })

  it('falls back when there is no returnTo at all', () => {
    expect(safeReturnTo(undefined)).toBe(DEFAULT_LANDING)
    expect(safeReturnTo(null)).toBe(DEFAULT_LANDING)
  })

  it('falls back on a repeated query param, which arrives as an array', () => {
    expect(safeReturnTo(['/admin/users', '/login'])).toBe(DEFAULT_LANDING)
  })

  it('refuses an absolute URL', () => {
    expect(safeReturnTo('https://evil.example/steal')).toBe(DEFAULT_LANDING)
    expect(safeReturnTo('http://evil.example')).toBe(DEFAULT_LANDING)
  })

  it('refuses a scheme-relative URL — the browser treats // as absolute', () => {
    expect(safeReturnTo('//evil.example/steal')).toBe(DEFAULT_LANDING)
  })

  it('refuses the backslash variant that normalises into //', () => {
    expect(safeReturnTo('/\\evil.example')).toBe(DEFAULT_LANDING)
  })

  it('refuses a path that would bounce straight back to login', () => {
    expect(safeReturnTo('/login')).toBe(DEFAULT_LANDING)
  })

  it('trims surrounding whitespace before deciding', () => {
    expect(safeReturnTo('  /admin/users  ')).toBe('/admin/users')
    expect(safeReturnTo('  https://evil.example  ')).toBe(DEFAULT_LANDING)
  })

  it('honours a caller-supplied fallback', () => {
    expect(safeReturnTo('https://evil.example', '/dashboard/discover')).toBe('/dashboard/discover')
  })
})
