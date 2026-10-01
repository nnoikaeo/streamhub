/**
 * Tests for app/utils/typeFilter.ts — Discover's Looker / Sheets filter.
 */

import { describe, it, expect } from 'vitest'
import { parseTypeFilter, matchesTypeFilter } from '../../app/utils/typeFilter'

describe('parseTypeFilter', () => {
  it('reads looker and sheet', () => {
    expect(parseTypeFilter('looker')).toBe('looker')
    expect(parseTypeFilter('sheet')).toBe('sheet')
  })

  it('treats a missing or unknown value as all — the default', () => {
    expect(parseTypeFilter(undefined)).toBe('all')
    expect(parseTypeFilter('')).toBe('all')
    expect(parseTypeFilter('pdf')).toBe('all')
    expect(parseTypeFilter('looker,sheet')).toBe('all')
  })

  it('takes the first of a repeated parameter', () => {
    expect(parseTypeFilter(['sheet', 'looker'])).toBe('sheet')
  })
})

describe('matchesTypeFilter', () => {
  const looker = { type: 'looker' as const }
  const sheet = { type: 'sheet' as const }

  it('all shows every type', () => {
    expect(matchesTypeFilter(looker, 'all')).toBe(true)
    expect(matchesTypeFilter(sheet, 'all')).toBe(true)
  })

  it('a type shows only that type', () => {
    expect(matchesTypeFilter(sheet, 'sheet')).toBe(true)
    expect(matchesTypeFilter(looker, 'sheet')).toBe(false)
    expect(matchesTypeFilter(looker, 'looker')).toBe(true)
  })

  it('counts a dashboard with no type as Looker', () => {
    expect(matchesTypeFilter({}, 'looker')).toBe(true)
    expect(matchesTypeFilter({}, 'sheet')).toBe(false)
  })
})
