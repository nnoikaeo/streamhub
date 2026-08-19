/**
 * Tests for app/utils/cascadeDelete.ts (BUG-005, delete direction)
 *
 * Deleting a group used to leave its id in every member's `groups[]` — the
 * admin users table then rendered a badge for a group that no longer existed.
 * Deleting a user left them in `group.members[]` and in the folders they
 * moderated. These planners decide what else has to change, and the confirm
 * dialog counts come from the same call that performs the cleanup.
 */

import { describe, it, expect, vi } from 'vitest'
import {
  planGroupDeleteCascade,
  planUserDeleteCascade,
  applyGroupDeleteCascade,
  applyUserDeleteCascade,
} from '../../app/utils/cascadeDelete'
import type { Folder, User } from '../../app/types/dashboard'
import type { AdminGroup } from '../../app/types/admin'

const user = (uid: string, groups: string[] = []): User => ({
  uid,
  email: `${uid}@example.com`,
  name: uid,
  role: 'user',
  company: 'STTH',
  groups,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
})

const group = (id: string, members: string[] = []): AdminGroup =>
  ({ id, name: id, members, isActive: true }) as AdminGroup

const folder = (id: string, assignedModerators: string[] = []): Folder =>
  ({ id, name: id, assignedModerators }) as Folder

describe('planGroupDeleteCascade', () => {
  it('names every user carrying the group', () => {
    const users = [user('u1', ['sales', 'ops']), user('u2', ['ops']), user('u3', ['sales'])]
    expect(planGroupDeleteCascade('sales', users).userIds).toEqual(['u1', 'u3'])
  })

  it('returns nothing when the group has no members', () => {
    expect(planGroupDeleteCascade('sales', [user('u1', ['ops'])]).userIds).toEqual([])
  })

  it('reads user.groups, not group.members — access control reads the user side', () => {
    // A legacy record where the two disagree: the group claims u2, the user does not
    const users = [user('u1', ['sales'])]
    expect(planGroupDeleteCascade('sales', users).userIds).toEqual(['u1'])
  })

  it('tolerates a user document with no groups field', () => {
    const legacy = { ...user('u1'), groups: undefined } as unknown as User
    expect(planGroupDeleteCascade('sales', [legacy]).userIds).toEqual([])
  })
})

describe('planUserDeleteCascade', () => {
  it('names both the groups and the folders holding the uid', () => {
    const groups = [group('sales', ['u1', 'u2']), group('ops', ['u2'])]
    const folders = [folder('f1', ['u1']), folder('f2', ['u2']), folder('f3', ['u1', 'u2'])]

    expect(planUserDeleteCascade('u1', groups, folders)).toEqual({
      groupIds: ['sales'],
      folderIds: ['f1', 'f3'],
    })
  })

  it('returns empty lists for a user nothing references', () => {
    expect(planUserDeleteCascade('ghost', [group('sales', ['u1'])], [folder('f1', ['u1'])])).toEqual({
      groupIds: [],
      folderIds: [],
    })
  })

  it('tolerates missing members / assignedModerators fields', () => {
    const bareGroup = { id: 'sales', name: 'sales' } as AdminGroup
    const bareFolder = { id: 'f1', name: 'f1' } as Folder
    expect(planUserDeleteCascade('u1', [bareGroup], [bareFolder])).toEqual({
      groupIds: [],
      folderIds: [],
    })
  })
})

describe('applyGroupDeleteCascade', () => {
  it('writes each affected user once, keeping their other groups', async () => {
    const users = [user('u1', ['sales', 'ops']), user('u2', ['sales'])]
    const updateUser = vi.fn().mockResolvedValue(undefined)

    const writes = await applyGroupDeleteCascade(
      'sales',
      planGroupDeleteCascade('sales', users),
      users,
      updateUser
    )

    expect(writes).toBe(2)
    expect(updateUser).toHaveBeenCalledWith('u1', { groups: ['ops'] })
    expect(updateUser).toHaveBeenCalledWith('u2', { groups: [] })
  })

  it('writes nothing when no user carries the group', async () => {
    const updateUser = vi.fn()
    const writes = await applyGroupDeleteCascade('sales', { userIds: [] }, [], updateUser)

    expect(writes).toBe(0)
    expect(updateUser).not.toHaveBeenCalled()
  })

  it('skips a planned uid that is no longer in the list it was planned from', async () => {
    const updateUser = vi.fn()
    const writes = await applyGroupDeleteCascade('sales', { userIds: ['gone'] }, [], updateUser)

    expect(writes).toBe(0)
    expect(updateUser).not.toHaveBeenCalled()
  })
})

describe('applyUserDeleteCascade', () => {
  it('strips the uid from groups and folders, leaving other members intact', async () => {
    const groups = [group('sales', ['u1', 'u2'])]
    const folders = [folder('f1', ['u1', 'u9'])]
    const updateGroup = vi.fn().mockResolvedValue(undefined)
    const updateFolder = vi.fn().mockResolvedValue(undefined)

    const writes = await applyUserDeleteCascade(
      'u1',
      planUserDeleteCascade('u1', groups, folders),
      groups,
      folders,
      updateGroup,
      updateFolder
    )

    expect(writes).toBe(2)
    expect(updateGroup).toHaveBeenCalledWith('sales', { members: ['u2'] })
    expect(updateFolder).toHaveBeenCalledWith('f1', { assignedModerators: ['u9'] })
  })

  it('does nothing when the user is referenced nowhere', async () => {
    const updateGroup = vi.fn()
    const updateFolder = vi.fn()

    const writes = await applyUserDeleteCascade(
      'ghost',
      { groupIds: [], folderIds: [] },
      [],
      [],
      updateGroup,
      updateFolder
    )

    expect(writes).toBe(0)
    expect(updateGroup).not.toHaveBeenCalled()
    expect(updateFolder).not.toHaveBeenCalled()
  })
})
