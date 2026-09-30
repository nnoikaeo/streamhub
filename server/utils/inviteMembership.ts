/**
 * The mirror writes an accepted invitation owes.
 *
 * Membership is stored on both sides — `users.groups[]` ↔ `groups.members[]`,
 * `users.assignedFolders[]` ↔ `folders.assignedModerators[]` — and every admin
 * form writes both (BUG-005, `app/utils/groupSync.ts`, `folderAssignment.ts`).
 * Accepting an invitation wrote only the user's side. On prod that left three
 * admins named in no group's `members[]` (invited 2026-09-23), and a moderator
 * invited with folders could not manage them: the server checks
 * `folders.assignedModerators[]`, which the accept never touched.
 *
 * Only groups and folders that exist are returned — a Firestore `update` on a
 * missing doc fails the whole batch, and a dead id is `audit:orphans`' job.
 */

export interface InviteMembershipInput {
  uid: string
  role: string
  groupIds: readonly string[]
  folderIds: readonly string[]
  groups: readonly { id: string, members?: string[] }[]
  folders: readonly { id: string, assignedModerators?: string[] }[]
}

export interface InviteMembershipPlan {
  /** Groups whose `members[]` must gain the uid */
  groupIds: string[]
  /** Folders whose `assignedModerators[]` must gain the uid (moderators only) */
  folderIds: string[]
}

export function planInviteMembership(input: InviteMembershipInput): InviteMembershipPlan {
  const { uid, role, groupIds, folderIds, groups, folders } = input

  const joinGroups = [...new Set(groupIds)].filter((id) => {
    const group = groups.find((g) => g.id === id)
    return !!group && !(group.members ?? []).includes(uid)
  })

  const joinFolders = role !== 'moderator'
    ? []
    : [...new Set(folderIds)].filter((id) => {
        const folder = folders.find((f) => f.id === id)
        return !!folder && !(folder.assignedModerators ?? []).includes(uid)
      })

  return { groupIds: joinGroups, folderIds: joinFolders }
}

/**
 * Reactivating an account rewrites `users.groups[]` wholesale (new role, new
 * groups, or the old ones kept), and wrote nothing on the group side — the
 * same one-sided write as BUG-040. The account may also have been deactivated
 * with stale entries in some `members[]`, so this compares against every
 * group rather than a before/after diff: the uid must be listed exactly by the
 * groups its `groups[]` names.
 */
export function planGroupMembership(input: {
  uid: string
  groupIds: readonly string[]
  groups: readonly { id: string, members?: string[] }[]
}): { join: string[], leave: string[] } {
  const { uid, groupIds, groups } = input
  const join: string[] = []
  const leave: string[] = []
  for (const g of groups) {
    const listed = (g.members ?? []).includes(uid)
    const named = groupIds.includes(g.id)
    if (named && !listed) join.push(g.id)
    if (!named && listed) leave.push(g.id)
  }
  return { join, leave }
}
