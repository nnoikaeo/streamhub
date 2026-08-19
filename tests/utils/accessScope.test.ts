/**
 * Tests for app/utils/accessScope.ts (BUG-020)
 *
 * The editor offers to clear a user's restriction only when the grant being
 * removed was their last way in. Wrong in the permissive direction and an
 * expiry an admin set on a company-wide grant vanishes with an unrelated click.
 */

import { describe, it, expect } from 'vitest'
import { hasAccess, restrictedWithoutAccess, ALL_COMPANIES } from '../../app/utils/accessScope'

const noGroups: Record<string, string[]> = {}
const empty = { users: [], groups: [], companies: [] }

describe('hasAccess', () => {
  it('is true for a direct user grant', () => {
    expect(hasAccess('uid_a', { ...empty, users: ['uid_a'] }, 'OAYT', noGroups)).toBe(true)
  })

  it('is true for a public dashboard', () => {
    expect(hasAccess('uid_a', { ...empty, public: true }, 'OAYT', noGroups)).toBe(true)
  })

  it('is true when the user company is granted, false for another company', () => {
    expect(hasAccess('uid_a', { ...empty, companies: ['OAYT'] }, 'OAYT', noGroups)).toBe(true)
    expect(hasAccess('uid_a', { ...empty, companies: ['STTH'] }, 'OAYT', noGroups)).toBe(false)
  })

  it('is true for the all-companies sentinel', () => {
    expect(hasAccess('uid_a', { ...empty, companies: [ALL_COMPANIES] }, 'OAYT', noGroups)).toBe(true)
  })

  it('follows group membership', () => {
    const state = { ...empty, groups: ['finance'] }
    expect(hasAccess('uid_a', state, 'OAYT', { finance: ['uid_a'] })).toBe(true)
    expect(hasAccess('uid_a', state, 'OAYT', { finance: ['uid_b'] })).toBe(false)
  })

  it('is false with no grant at all', () => {
    expect(hasAccess('uid_a', empty, 'OAYT', noGroups)).toBe(false)
    expect(hasAccess('uid_a', empty, undefined, noGroups)).toBe(false)
  })
})

describe('restrictedWithoutAccess', () => {
  const companyOf = { uid_a: 'OAYT', uid_b: 'STTH' }

  it('lists a restricted user left with nothing after the removal', () => {
    expect(restrictedWithoutAccess(['uid_a'], empty, companyOf, noGroups)).toEqual(['uid_a'])
  })

  it('leaves alone a restricted user still covered by a company grant', () => {
    const state = { ...empty, companies: ['OAYT'] }

    expect(restrictedWithoutAccess(['uid_a'], state, companyOf, noGroups)).toEqual([])
  })

  it('leaves alone a restricted user still covered by a group grant', () => {
    const state = { ...empty, groups: ['finance'] }

    expect(restrictedWithoutAccess(['uid_a'], state, companyOf, { finance: ['uid_a'] })).toEqual([])
  })

  it('reports only the stranded users when several carry restrictions', () => {
    const state = { ...empty, companies: ['STTH'] }

    expect(restrictedWithoutAccess(['uid_a', 'uid_b'], state, companyOf, noGroups)).toEqual(['uid_a'])
  })

  it('reports nothing while the dashboard is public', () => {
    const state = { ...empty, public: true }

    expect(restrictedWithoutAccess(['uid_a', 'uid_b'], state, companyOf, noGroups)).toEqual([])
  })

  it('reports nothing when no one carries a restriction', () => {
    expect(restrictedWithoutAccess([], empty, companyOf, noGroups)).toEqual([])
  })
})
