/**
 * Regression tests for app/utils/groupSync.ts (BUG-005)
 *
 * Group membership was stored on both user.groups[] (edited via UserForm) and
 * group.members[] (edited via GroupForm) with no sync between them, so the two
 * could diverge — access control reads user.groups[], but member-count/preview
 * UI read group.members[], producing misleading previews.
 */

import { describe, it, expect, vi } from 'vitest'
import { diffIds, applyUserGroupsSync, applyGroupMembersSync } from '../../app/utils/groupSync'

describe('diffIds', () => {
  it('detects additions and removals', () => {
    expect(diffIds(['a', 'b'], ['b', 'c'])).toEqual({ toAdd: ['c'], toRemove: ['a'] })
  })

  it('empty diff when unchanged', () => {
    expect(diffIds(['a', 'b'], ['a', 'b'])).toEqual({ toAdd: [], toRemove: [] })
  })

  it('handles empty previous (new item)', () => {
    expect(diffIds([], ['a'])).toEqual({ toAdd: ['a'], toRemove: [] })
  })
})

describe('applyUserGroupsSync — user.groups[] changed, sync group.members[]', () => {
  it('adds the uid to newly-joined groups only', async () => {
    const groups = [
      { id: 'operations', members: ['other-uid'] },
      { id: 'marketing', members: [] },
    ]
    const updateGroup = vi.fn().mockResolvedValue(undefined)
    const diff = diffIds([], ['operations', 'marketing'])

    const writes = await applyUserGroupsSync('survey-uid', diff, groups, updateGroup)

    expect(writes).toBe(2)
    expect(updateGroup).toHaveBeenCalledWith('operations', { members: ['other-uid', 'survey-uid'] })
    expect(updateGroup).toHaveBeenCalledWith('marketing', { members: ['survey-uid'] })
  })

  it('removes the uid from left groups', async () => {
    const groups = [{ id: 'operations', members: ['survey-uid', 'other-uid'] }]
    const updateGroup = vi.fn().mockResolvedValue(undefined)
    const diff = diffIds(['operations'], [])

    const writes = await applyUserGroupsSync('survey-uid', diff, groups, updateGroup)

    expect(writes).toBe(1)
    expect(updateGroup).toHaveBeenCalledWith('operations', { members: ['other-uid'] })
  })

  it('is a no-op when the uid is already present (idempotent)', async () => {
    const groups = [{ id: 'operations', members: ['survey-uid'] }]
    const updateGroup = vi.fn().mockResolvedValue(undefined)
    const diff = diffIds([], ['operations'])

    const writes = await applyUserGroupsSync('survey-uid', diff, groups, updateGroup)

    expect(writes).toBe(0)
    expect(updateGroup).not.toHaveBeenCalled()
  })

  it('skips groups that no longer exist', async () => {
    const updateGroup = vi.fn().mockResolvedValue(undefined)
    const diff = diffIds([], ['deleted-group'])

    const writes = await applyUserGroupsSync('u1', diff, [], updateGroup)

    expect(writes).toBe(0)
    expect(updateGroup).not.toHaveBeenCalled()
  })
})

describe('applyGroupMembersSync — group.members[] changed, sync user.groups[]', () => {
  it('adds the group to newly-added members only', async () => {
    const users = [
      { uid: 'janine', groups: ['operations'] },
      { uid: 'survey', groups: ['marketing'] },
    ]
    const updateUser = vi.fn().mockResolvedValue(undefined)
    const diff = diffIds(['janine'], ['janine', 'survey'])

    const writes = await applyGroupMembersSync('operations', diff, users, updateUser)

    expect(writes).toBe(1)
    expect(updateUser).toHaveBeenCalledWith('survey', { groups: ['marketing', 'operations'] })
  })

  it('removes the group from dropped members', async () => {
    const users = [{ uid: 'janine', groups: ['operations', 'finance'] }]
    const updateUser = vi.fn().mockResolvedValue(undefined)
    const diff = diffIds(['janine'], [])

    const writes = await applyGroupMembersSync('operations', diff, users, updateUser)

    expect(writes).toBe(1)
    expect(updateUser).toHaveBeenCalledWith('janine', { groups: ['finance'] })
  })

  it('skips uids for users that no longer exist (stale/deleted)', async () => {
    const updateUser = vi.fn().mockResolvedValue(undefined)
    const diff = diffIds([], ['deleted-user'])

    const writes = await applyGroupMembersSync('operations', diff, [], updateUser)

    expect(writes).toBe(0)
    expect(updateUser).not.toHaveBeenCalled()
  })
})
