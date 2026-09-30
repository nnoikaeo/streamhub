/**
 * Tests for server/utils/inviteMembership.ts
 *
 * Accepting an invitation wrote `users.groups[]` / `users.assignedFolders[]`
 * but never the mirrored `groups.members[]` / `folders.assignedModerators[]`.
 */

import { describe, it, expect } from 'vitest'
import { planInviteMembership, planGroupMembership } from '../../server/utils/inviteMembership'

const groups = [
  { id: 'admin', members: [] },
  { id: 'sales', members: ['someone'] },
  { id: 'already', members: ['uid_new'] },
]
const folders = [
  { id: 'folder_a', assignedModerators: [] },
  { id: 'folder_b' },
]

describe('planInviteMembership', () => {
  it('adds the new user to every invited group', () => {
    const plan = planInviteMembership({ uid: 'uid_new', role: 'admin', groupIds: ['admin', 'sales'], folderIds: [], groups, folders })
    expect(plan.groupIds).toEqual(['admin', 'sales'])
  })

  it('skips a group that no longer exists — updating it would fail the batch', () => {
    const plan = planInviteMembership({ uid: 'uid_new', role: 'user', groupIds: ['sales', 'deleted'], folderIds: [], groups, folders })
    expect(plan.groupIds).toEqual(['sales'])
  })

  it('skips a group that already lists the user, and duplicate ids', () => {
    const plan = planInviteMembership({ uid: 'uid_new', role: 'user', groupIds: ['already', 'sales', 'sales'], folderIds: [], groups, folders })
    expect(plan.groupIds).toEqual(['sales'])
  })

  it('puts an invited moderator on their folders, which is what the server checks', () => {
    const plan = planInviteMembership({ uid: 'uid_new', role: 'moderator', groupIds: [], folderIds: ['folder_a', 'folder_b', 'gone'], groups, folders })
    expect(plan.folderIds).toEqual(['folder_a', 'folder_b'])
  })

  it('never assigns folders to a role that is not moderator', () => {
    const plan = planInviteMembership({ uid: 'uid_new', role: 'user', groupIds: [], folderIds: ['folder_a'], groups, folders })
    expect(plan.folderIds).toEqual([])
  })
})

describe('planGroupMembership (reactivate)', () => {
  const all = [
    { id: 'sales', members: ['uid_back'] },
    { id: 'finance', members: [] },
    { id: 'marketing', members: ['someone'] },
  ]

  it('joins the groups the account now names and leaves the ones it no longer does', () => {
    expect(planGroupMembership({ uid: 'uid_back', groupIds: ['finance'], groups: all }))
      .toEqual({ join: ['finance'], leave: ['sales'] })
  })

  it('does nothing when both sides already agree', () => {
    expect(planGroupMembership({ uid: 'uid_back', groupIds: ['sales'], groups: all }))
      .toEqual({ join: [], leave: [] })
  })

  it('removes an account reactivated as admin from every group', () => {
    expect(planGroupMembership({ uid: 'uid_back', groupIds: [], groups: all }))
      .toEqual({ join: [], leave: ['sales'] })
  })

  it('ignores a named group that does not exist', () => {
    expect(planGroupMembership({ uid: 'uid_back', groupIds: ['sales', 'gone'], groups: all }))
      .toEqual({ join: [], leave: [] })
  })
})
