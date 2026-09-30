/**
 * Tests for shared/utils/roleGroups.ts — admins hold no groups.
 */

import { describe, it, expect } from 'vitest'
import { groupsForRole } from '../../shared/utils/roleGroups'

describe('groupsForRole', () => {
  it('drops every group for an admin', () => {
    expect(groupsForRole('admin', ['admin', 'sales'])).toEqual([])
  })

  it('keeps groups for user and moderator', () => {
    expect(groupsForRole('user', ['sales'])).toEqual(['sales'])
    expect(groupsForRole('moderator', ['sales', 'finance'])).toEqual(['sales', 'finance'])
  })

  it('returns a copy, not the caller\'s array', () => {
    const groups = ['sales']
    expect(groupsForRole('user', groups)).not.toBe(groups)
  })

  it('treats missing groups as none', () => {
    expect(groupsForRole('user', undefined)).toEqual([])
  })
})
