/**
 * Tests for app/utils/expiryWrite.ts (BUG-018)
 *
 * The permissions page used to write `restrictions.expiry` as whatever it was
 * holding — an ISO string after its JSON deep clone — so the same field carried
 * two different shapes depending on which screen wrote it. Every save now
 * normalises to a Timestamp.
 */

import { describe, it, expect, vi } from 'vitest'
import { toExpiryTimestamps } from '../../app/utils/expiryWrite'

/** Stand-in for Timestamp.fromDate — only the round trip matters here. */
const toStamp = (date: Date) => ({ kind: 'ts', ms: date.getTime() })

describe('toExpiryTimestamps', () => {
  it('converts a Date', () => {
    const date = new Date('2026-08-18T16:59:59.999Z')

    expect(toExpiryTimestamps({ uid_a: date }, toStamp)).toEqual({
      uid_a: { kind: 'ts', ms: date.getTime() },
    })
  })

  it('converts an ISO string — the shape the JSON clone produces', () => {
    const iso = '2026-08-18T16:59:59.999Z'

    expect(toExpiryTimestamps({ uid_a: iso }, toStamp)).toEqual({
      uid_a: { kind: 'ts', ms: new Date(iso).getTime() },
    })
  })

  it('converts a Timestamp that has been through JSON', () => {
    const seconds = Math.floor(new Date('2026-08-18T16:59:59.000Z').getTime() / 1000)

    expect(toExpiryTimestamps({ uid_a: { seconds, nanoseconds: 0 } }, toStamp)).toEqual({
      uid_a: { kind: 'ts', ms: seconds * 1000 },
    })
  })

  it('drops unreadable values instead of writing them', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const out = toExpiryTimestamps({ uid_a: 'not a date', uid_b: null }, toStamp)

    expect(out).toEqual({})
    expect(warn).toHaveBeenCalledTimes(2)
    warn.mockRestore()
  })

  it('keeps the readable entries when one is unreadable', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const date = new Date('2026-09-01T00:00:00.000Z')

    const out = toExpiryTimestamps({ good: date, bad: 'garbage' }, toStamp)

    expect(Object.keys(out)).toEqual(['good'])
    warn.mockRestore()
  })

  it('returns an empty map for an empty or missing input, and never mutates it', () => {
    const input = { uid_a: new Date('2026-08-18T00:00:00.000Z') }
    const snapshot = { ...input }

    expect(toExpiryTimestamps({}, toStamp)).toEqual({})
    expect(toExpiryTimestamps(undefined, toStamp)).toEqual({})

    toExpiryTimestamps(input, toStamp)
    expect(input).toEqual(snapshot)
  })
})
