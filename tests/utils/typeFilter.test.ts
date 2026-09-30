/**
 * Tests for app/utils/typeFilter.ts — Discover's Looker / Sheets filter.
 */

import { describe, it, expect } from 'vitest'
import { parseTypeFilter, matchesTypeFilter } from '../../app/utils/typeFilter'

describe('parseTypeFilter', () => {
  it('reads one type or a comma list, in a fixed order', () => {
    expect(parseTypeFilter('sheet')).toEqual(['sheet'])
    expect(parseTypeFilter('sheet,looker')).toEqual(['looker', 'sheet'])
  })

  it('drops unknown values and treats a missing parameter as no filter', () => {
    expect(parseTypeFilter('sheet,pdf')).toEqual(['sheet'])
    expect(parseTypeFilter(undefined)).toEqual([])
    expect(parseTypeFilter('')).toEqual([])
  })

  it('takes the first of a repeated parameter', () => {
    expect(parseTypeFilter(['looker', 'sheet'])).toEqual(['looker'])
  })
})

describe('matchesTypeFilter', () => {
  const looker = { type: 'looker' as const }
  const sheet = { type: 'sheet' as const }

  it('shows every type when nothing is selected — the default', () => {
    expect(matchesTypeFilter(looker, [])).toBe(true)
    expect(matchesTypeFilter(sheet, [])).toBe(true)
  })

  it('narrows to the selected type', () => {
    expect(matchesTypeFilter(sheet, ['sheet'])).toBe(true)
    expect(matchesTypeFilter(looker, ['sheet'])).toBe(false)
  })

  it('ORs several types — a dashboard has only one', () => {
    expect(matchesTypeFilter(looker, ['looker', 'sheet'])).toBe(true)
    expect(matchesTypeFilter(sheet, ['looker', 'sheet'])).toBe(true)
  })

  it('counts a dashboard with no type as Looker', () => {
    expect(matchesTypeFilter({}, ['looker'])).toBe(true)
    expect(matchesTypeFilter({}, ['sheet'])).toBe(false)
  })
})
