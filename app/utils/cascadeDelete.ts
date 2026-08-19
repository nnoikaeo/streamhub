/**
 * Delete-direction reference cleanup (BUG-005).
 *
 * Membership and moderator assignments are stored on both sides:
 * `user.groups[]` ↔ `group.members[]`, and `folder.assignedModerators[]` names
 * uids directly. Create and edit already sync both ways (see groupSync.ts and
 * folderAssignment.ts), but deleting either end left the other holding a dead
 * id — a deleted group kept showing as a badge on the admin users table, and a
 * deleted user stayed in `members[]` and in the folders they moderated.
 *
 * The planners here answer "what else has to change" without touching
 * Firestore, so the counts shown in the confirm dialog come from the same
 * calculation that performs the cleanup.
 */

import type { Folder, User } from '~/types/dashboard'
import type { AdminGroup } from '~/types/admin'

export interface GroupDeleteCascade {
  /** Users whose `groups[]` names the group being deleted */
  userIds: string[]
}

export interface UserDeleteCascade {
  /** Groups whose `members[]` names the user being deleted */
  groupIds: string[]
  /** Folders whose `assignedModerators[]` names the user being deleted */
  folderIds: string[]
}

/**
 * Who loses membership when this group goes away.
 *
 * Reads `user.groups[]` rather than `group.members[]`: access control reads the
 * user side, so it is the one that must end up clean — and the two can already
 * disagree on legacy records.
 */
export function planGroupDeleteCascade(groupId: string, users: User[]): GroupDeleteCascade {
  return {
    userIds: users.filter(u => (u.groups ?? []).includes(groupId)).map(u => u.uid),
  }
}

/** What still names this user once their account is deleted. */
export function planUserDeleteCascade(
  uid: string,
  groups: AdminGroup[],
  folders: Folder[]
): UserDeleteCascade {
  return {
    groupIds: groups.filter(g => (g.members ?? []).includes(uid)).map(g => g.id),
    folderIds: folders.filter(f => (f.assignedModerators ?? []).includes(uid)).map(f => f.id),
  }
}

/**
 * Strip the deleted group from every user that named it.
 * Returns the number of user writes performed.
 */
export async function applyGroupDeleteCascade(
  groupId: string,
  cascade: GroupDeleteCascade,
  users: User[],
  updateUser: (uid: string, data: Partial<User>) => Promise<User | undefined>
): Promise<number> {
  const writes: Promise<unknown>[] = []

  for (const uid of cascade.userIds) {
    const user = users.find(u => u.uid === uid)
    if (!user) continue
    writes.push(updateUser(uid, { groups: (user.groups ?? []).filter(g => g !== groupId) }))
  }

  await Promise.all(writes)
  return writes.length
}

/**
 * Strip the deleted user from every group and folder that named them.
 * Returns the number of writes performed across both collections.
 */
export async function applyUserDeleteCascade(
  uid: string,
  cascade: UserDeleteCascade,
  groups: AdminGroup[],
  folders: Folder[],
  updateGroup: (id: string, data: Partial<AdminGroup>) => Promise<AdminGroup | undefined>,
  updateFolder: (id: string, data: Partial<Folder>) => Promise<Folder | undefined>
): Promise<number> {
  const writes: Promise<unknown>[] = []

  for (const groupId of cascade.groupIds) {
    const group = groups.find(g => g.id === groupId)
    if (!group) continue
    writes.push(updateGroup(groupId, { members: (group.members ?? []).filter(m => m !== uid) }))
  }

  for (const folderId of cascade.folderIds) {
    const folder = folders.find(f => f.id === folderId)
    if (!folder) continue
    writes.push(
      updateFolder(folderId, {
        assignedModerators: (folder.assignedModerators ?? []).filter(m => m !== uid),
      })
    )
  }

  await Promise.all(writes)
  return writes.length
}
