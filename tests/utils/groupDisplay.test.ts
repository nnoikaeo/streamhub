/**
 * Tests for app/utils/groupDisplay.ts
 *
 * Group labels in the permission editor: which groups a user is in (and which
 * of those already grant access), and who a granted group actually covers.
 */

import { describe, it, expect } from 'vitest'
import { userGroupChips, groupMembers, memberPreview } from '../../app/utils/groupDisplay'

const groups = [
  { id: 'marketing', name: 'Marketing' },
  { id: 'operations', name: 'Operations' },
  { id: 'sales', name: 'Sales' },
  { id: 'finance', name: 'Finance' },
]

describe('userGroupChips', () => {
  it('shows group names, not ids', () => {
    const { shown } = userGroupChips(['marketing'], groups, [])
    expect(shown).toEqual([{ id: 'marketing', name: 'Marketing', granted: false }])
  })

  it('marks a group that is already granted', () => {
    const { shown } = userGroupChips(['marketing', 'operations'], groups, ['operations'])
    expect(shown.find((c) => c.id === 'operations')?.granted).toBe(true)
    expect(shown.find((c) => c.id === 'marketing')?.granted).toBe(false)
  })

  it('puts granted groups first so they are never folded into +N', () => {
    const { shown, hidden } = userGroupChips(['marketing', 'operations', 'finance'], groups, ['finance'])
    expect(shown.map((c) => c.id)).toEqual(['finance', 'marketing'])
    expect(hidden.map((c) => c.id)).toEqual(['operations'])
  })

  it('shows two and folds the rest', () => {
    const { shown, hidden } = userGroupChips(['marketing', 'operations', 'sales'], groups, [])
    expect(shown).toHaveLength(2)
    expect(hidden.map((c) => c.name)).toEqual(['Sales'])
  })

  it('drops ids that match no group instead of showing them raw', () => {
    const { shown, hidden } = userGroupChips(['marketing', 'deleted_group'], groups, [])
    expect([...shown, ...hidden].map((c) => c.id)).toEqual(['marketing'])
  })

  it('handles a user with no groups field', () => {
    expect(userGroupChips(undefined, groups, [])).toEqual({ shown: [], hidden: [] })
  })
})

describe('groupMembers', () => {
  const users = [
    { uid: 'u1', name: 'ก ข', groups: ['marketing', 'operations'] },
    { uid: 'u2', name: 'Nopphol', groups: ['sales'] },
    { uid: 'u3', name: 'No groups' },
  ]

  it('reads membership from the user side', () => {
    expect(groupMembers('marketing', users).map((u) => u.uid)).toEqual(['u1'])
  })

  it('returns nobody for a group no user names', () => {
    expect(groupMembers('finance', users)).toEqual([])
  })
})

describe('memberPreview', () => {
  const m = (name: string) => ({ uid: name, name })

  it('lists everyone when within the limit', () => {
    expect(memberPreview([m('A'), m('B')])).toEqual({ names: ['A', 'B'], extra: 0 })
  })

  it('lists the first three and counts the rest', () => {
    expect(memberPreview([m('A'), m('B'), m('C'), m('D'), m('E')])).toEqual({ names: ['A', 'B', 'C'], extra: 2 })
  })

  it('is empty for an empty group', () => {
    expect(memberPreview([])).toEqual({ names: [], extra: 0 })
  })
})
