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
