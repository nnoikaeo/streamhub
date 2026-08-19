/**
 * Tests for app/utils/accessScope.ts (BUG-020)
 *
 * Removing a direct grant offers to clear the user's restriction only when the
 * direct grant was their only way in. Get this wrong in the permissive
 * direction and an expiry an admin set on a company-wide grant disappears with
 * an unrelated click.
 */

import { describe, it, expect } from 'vitest'
import { hasAccessBesidesDirectUser, ALL_COMPANIES } from '../../app/utils/accessScope'

const noGroups: Record<string, string[]> = {}

describe('hasAccessBesidesDirectUser', () => {
  it('is false when the direct grant was the only way in', () => {
    const access = { company: [], groups: [] }

    expect(hasAccessBesidesDirectUser('uid_a', access, 'OAYT', noGroups)).toBe(false)
  })

  it('is true for a public dashboard', () => {
    const access = { public: true, company: [], groups: [] }

    expect(hasAccessBesidesDirectUser('uid_a', access, 'OAYT', noGroups)).toBe(true)
  })

  it('is true when the user company is granted', () => {
    const access = { company: ['OAYT'], groups: [] }

    expect(hasAccessBesidesDirectUser('uid_a', access, 'OAYT', noGroups)).toBe(true)
  })

  it('is false when a different company is granted', () => {
    const access = { company: ['STTH'], groups: [] }

    expect(hasAccessBesidesDirectUser('uid_a', access, 'OAYT', noGroups)).toBe(false)
  })

  it('is true for the all-companies sentinel', () => {
    const access = { company: [ALL_COMPANIES], groups: [] }

    expect(hasAccessBesidesDirectUser('uid_a', access, 'OAYT', noGroups)).toBe(true)
  })

  it('is true when a granted group lists the user', () => {
    const access = { company: [], groups: ['finance'] }

    expect(
      hasAccessBesidesDirectUser('uid_a', access, 'OAYT', { finance: ['uid_a', 'uid_b'] }),
    ).toBe(true)
  })

  it('is false when the granted group does not list the user', () => {
    const access = { company: [], groups: ['finance'] }

    expect(hasAccessBesidesDirectUser('uid_a', access, 'OAYT', { finance: ['uid_b'] })).toBe(false)
  })

  it('is false when the user has no company and nothing else grants access', () => {
    const access = { company: ['STTH'], groups: ['finance'] }

    expect(hasAccessBesidesDirectUser('uid_a', access, undefined, { finance: [] })).toBe(false)
  })
})
