/**
 * Tests for app/utils/ownershipFilter.ts — Discover's `?filter=my|shared`,
 * which the home cards link to and Discover used to ignore.
 */

import { describe, it, expect } from 'vitest'
import { parseOwnershipFilter, matchesOwnershipFilter } from '../../app/utils/ownershipFilter'
import { sharedBreakdown } from '../../app/utils/sharedCount'

describe('parseOwnershipFilter', () => {
  it('reads my and shared', () => {
    expect(parseOwnershipFilter('my')).toBe('my')
    expect(parseOwnershipFilter('shared')).toBe('shared')
  })

  it('takes the first of a repeated parameter', () => {
    expect(parseOwnershipFilter(['shared', 'my'])).toBe('shared')
  })

  it('treats anything else as no filter', () => {
    expect(parseOwnershipFilter(undefined)).toBeNull()
    expect(parseOwnershipFilter('')).toBeNull()
    expect(parseOwnershipFilter('MY')).toBeNull()
    expect(parseOwnershipFilter('company')).toBeNull()
  })
})

describe('matchesOwnershipFilter', () => {
  const list = [
    { owner: 'survey' },
    { owner: 'x' },
    { owner: 'y' },
    {},
  ]

  it('splits a list into the viewer\'s own and everything else, with nothing lost', () => {
    const my = list.filter((d) => matchesOwnershipFilter(d, 'my', 'survey'))
    const shared = list.filter((d) => matchesOwnershipFilter(d, 'shared', 'survey'))
    expect(my).toHaveLength(1)
    expect(shared).toHaveLength(3)
  })

  it('shared agrees with the home card count', () => {
    const shared = list.filter((d) => matchesOwnershipFilter(d, 'shared', 'survey'))
    expect(shared).toHaveLength(sharedBreakdown(list, { uid: 'survey' }).total)
  })

  it('owns nothing while the uid is not known yet', () => {
    expect(matchesOwnershipFilter({ owner: 'survey' }, 'my', undefined)).toBe(false)
    expect(matchesOwnershipFilter({}, 'my', undefined)).toBe(false)
  })
})
