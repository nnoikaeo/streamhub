/**
 * Tests for shared/utils/dates.ts
 *
 * The permission path reads `restrictions.expiry` values that arrive as ISO
 * strings (JSON store) or as Firestore Timestamps (production), while the type
 * declares `Date`. All three have to resolve, or an expiry silently never fires.
 */

import { describe, it, expect } from 'vitest'
import { toDate, isExpired } from '../../shared/utils/dates'

/** Stand-in for a Firestore Timestamp — only `toDate()` is read. */
const timestamp = (date: Date) => ({
  seconds: Math.floor(date.getTime() / 1000),
  nanoseconds: 0,
  toDate: () => date,
})

describe('toDate', () => {
  const when = new Date('2026-01-01T00:00:00.000Z')

  it('passes a valid Date through', () => {
    expect(toDate(when)).toEqual(when)
  })

  it('parses an ISO string', () => {
    expect(toDate('2026-01-01T00:00:00.000Z')).toEqual(when)
  })

  it('parses an epoch number', () => {
    expect(toDate(when.getTime())).toEqual(when)
  })

  it('reads a Firestore Timestamp via toDate()', () => {
    expect(toDate(timestamp(when))).toEqual(when)
  })

  it('reads a serialized Timestamp from its seconds field', () => {
    expect(toDate({ seconds: when.getTime() / 1000, nanoseconds: 0 })).toEqual(when)
    expect(toDate({ _seconds: when.getTime() / 1000, _nanoseconds: 0 })).toEqual(when)
  })

  it('returns null for absent or unparseable values', () => {
    expect(toDate(null)).toBeNull()
    expect(toDate(undefined)).toBeNull()
    expect(toDate('not a date')).toBeNull()
    expect(toDate(new Date('nope'))).toBeNull()
    expect(toDate({})).toBeNull()
  })
})

describe('isExpired', () => {
  const now = new Date('2026-06-01T00:00:00.000Z')
  const past = new Date('2026-01-01T00:00:00.000Z')
  const future = new Date('2026-12-01T00:00:00.000Z')

  it('is true only for a date in the past', () => {
    expect(isExpired(past, now)).toBe(true)
    expect(isExpired(future, now)).toBe(false)
  })

  it('handles ISO strings and Timestamps the same way', () => {
    expect(isExpired(past.toISOString(), now)).toBe(true)
    expect(isExpired(timestamp(past), now)).toBe(true)
    expect(isExpired(timestamp(future), now)).toBe(false)
  })

  it('does not expire on absent or unreadable values', () => {
    expect(isExpired(undefined, now)).toBe(false)
    expect(isExpired('garbage', now)).toBe(false)
  })
})
