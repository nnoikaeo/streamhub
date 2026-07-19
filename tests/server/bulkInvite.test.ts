/**
 * Regression tests for server/utils/bulkInvite.ts — normalizeBulkItems
 *
 * Covers BUG-004: bulk invite must apply per-row role/company/group from the
 * items[] payload instead of collapsing everyone onto the first row's values.
 */

import { describe, it, expect } from 'vitest'
import { normalizeBulkItems } from '../../server/utils/bulkInvite'

describe('normalizeBulkItems — per-row (items[]) payload', () => {
  it('keeps each row\'s own role, company, and groups (BUG-004)', () => {
    const result = normalizeBulkItems({
      items: [
        { email: 'a@x.com', role: 'user', company: 'STTH', assignedGroups: [] },
        { email: 'b@x.com', role: 'moderator', company: 'STTN', assignedGroups: ['g-mgmt'] },
      ],
      // flat fallbacks present but must NOT override per-row values
      role: 'user',
      company: 'STTH',
      assignedGroups: [],
    })

    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({ email: 'a@x.com', role: 'user', company: 'STTH', assignedGroups: [] })
    expect(result[1]).toMatchObject({ email: 'b@x.com', role: 'moderator', company: 'STTN', assignedGroups: ['g-mgmt'] })
  })

  it('lowercases and trims emails', () => {
    const [item] = normalizeBulkItems({ items: [{ email: '  B@X.COM ', role: 'user', company: 'STTH' }] })
    expect(item.email).toBe('b@x.com')
  })

  it('drops rows without an email', () => {
    const result = normalizeBulkItems({
      items: [{ email: '', role: 'user', company: 'STTH' }, { email: 'ok@x.com', role: 'user', company: 'STTH' }],
    })
    expect(result).toHaveLength(1)
    expect(result[0].email).toBe('ok@x.com')
  })

  it('defaults message/assignedFolders/assignedGroups when omitted', () => {
    const [item] = normalizeBulkItems({ items: [{ email: 'a@x.com', role: 'user', company: 'STTH' }] })
    expect(item.message).toBe('')
    expect(item.assignedFolders).toEqual([])
    expect(item.assignedGroups).toEqual([])
  })

  it('does NOT inherit shared flat groups for a row that omits them (BUG-004 leak)', () => {
    const result = normalizeBulkItems({
      items: [
        { email: 'a@x.com', role: 'moderator', company: 'STSB', assignedGroups: ['finance'] },
        { email: 'b@x.com', role: 'user', company: 'STCM' }, // no groups → must stay empty
      ],
      // client also sends flat fallbacks derived from row 1 — must be ignored per-row
      role: 'moderator',
      company: 'STSB',
      assignedGroups: ['finance'],
    })

    expect(result[1]).toMatchObject({ email: 'b@x.com', role: 'user', company: 'STCM' })
    expect(result[1].assignedGroups).toEqual([])
  })
})

describe('normalizeBulkItems — flat (legacy emails[]) payload', () => {
  it('expands emails[] with shared role/company/group', () => {
    const result = normalizeBulkItems({
      emails: ['a@x.com', 'b@x.com'],
      role: 'moderator',
      company: 'STCS',
      assignedGroups: ['g1'],
    })

    expect(result).toHaveLength(2)
    expect(result.every(r => r.role === 'moderator' && r.company === 'STCS')).toBe(true)
    expect(result[0].assignedGroups).toEqual(['g1'])
  })

  it('prefers items[] over emails[] when both are present', () => {
    const result = normalizeBulkItems({
      items: [{ email: 'a@x.com', role: 'admin', company: 'STTH' }],
      emails: ['ignored@x.com'],
      role: 'user',
      company: 'STTN',
    })

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ email: 'a@x.com', role: 'admin', company: 'STTH' })
  })

  it('returns an empty list when neither items[] nor emails[] provided', () => {
    expect(normalizeBulkItems({ role: 'user', company: 'STTH' })).toEqual([])
  })
})
