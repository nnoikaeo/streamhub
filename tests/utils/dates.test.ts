/**
 * Tests for shared/utils/dates.ts
 *
 * The permission path reads `restrictions.expiry` values that arrive as ISO
 * strings (JSON store) or as Firestore Timestamps (production), while the type
 * declares `Date`. All three have to resolve, or an expiry silently never fires.
 */

import { describe, it, expect } from 'vitest'
import { toDate, isExpired, endOfDayLocal } from '../../shared/utils/dates'

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

describe('endOfDayLocal', () => {
  it('returns the last instant of the chosen day in local time', () => {
    const date = endOfDayLocal('2026-08-17')

    // Local getters, so the assertion holds whatever TZ the runner is in —
    // the contract is "end of the day the user picked", not a fixed UTC offset.
    expect(date?.getFullYear()).toBe(2026)
    expect(date?.getMonth()).toBe(7)
    expect(date?.getDate()).toBe(17)
    expect(date?.getHours()).toBe(23)
    expect(date?.getMinutes()).toBe(59)
    expect(date?.getSeconds()).toBe(59)
    expect(date?.getMilliseconds()).toBe(999)
  })

  it('lands after midnight UTC of the same date (the bug this avoids)', () => {
    // new Date('2026-08-17') is 00:00 UTC — 07:00 in Bangkok, so an expiry set
    // "for the 17th" would have cut out on the morning of the 17th.
    const date = endOfDayLocal('2026-08-17')
    expect(date!.getTime()).toBeGreaterThan(new Date('2026-08-17T00:00:00.000Z').getTime())
  })

  it('is not expired at any point during the chosen day', () => {
    const date = endOfDayLocal('2026-08-17')!
    const middayLocal = new Date(2026, 7, 17, 12, 0, 0)
    expect(isExpired(date, middayLocal)).toBe(false)
    expect(isExpired(date, new Date(2026, 7, 18, 0, 0, 0))).toBe(true)
  })

  it('returns null for absent, malformed, or non-existent dates', () => {
    expect(endOfDayLocal(undefined)).toBeNull()
    expect(endOfDayLocal('')).toBeNull()
    expect(endOfDayLocal('17/08/2026')).toBeNull()
    expect(endOfDayLocal('2026-8-7')).toBeNull()
    expect(endOfDayLocal('2026-02-31')).toBeNull()
  })
})
