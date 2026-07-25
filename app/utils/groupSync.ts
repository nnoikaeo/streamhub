/**
 * Group ↔ User Membership Sync Utilities
 *
 * Group membership is stored on BOTH sides — `user.groups[]` (edited via the
 * user form) and `group.members[]` (edited via the group form) — because each
 * form needs its own list to render. Access control reads `user.groups[]`
 * (see useFirestoreService/useMockData/companyAccess checkAccess), so that
 * field must always be correct; `group.members[]` is a denormalized view used
 * for member counts and pickers (PermissionsPage, PermissionEditor, GroupViewModal).
 *
 * Editing either side must write through to the other, or they drift — which
 * is exactly what happened before this fix (BUG-005): a user's `groups[]`
 * could include a group whose own `members[]` never listed them.
 *
 * These helpers mirror the diff/apply pattern in folderAssignment.ts.
 */

export interface IdDiff {
  toAdd: string[]
  toRemove: string[]
}

/** Plain set-diff between a previous and current ID list. */
export function diffIds(previous: string[], current: string[]): IdDiff {
  const prevSet = new Set(previous)
  const currSet = new Set(current)
  return {
    toAdd: current.filter(id => !prevSet.has(id)),
    toRemove: previous.filter(id => !currSet.has(id)),
  }
}

/**
 * User's `groups[]` changed (saved via UserForm) — sync affected groups'
 * `members[]` so GroupViewModal / effective-access previews stay accurate.
 */
export async function applyUserGroupsSync(
  uid: string,
  diff: IdDiff,
  allGroups: { id: string; members?: string[] }[],
  updateGroup: (id: string, data: { members: string[] }) => Promise<unknown>
): Promise<number> {
  const writes: Promise<unknown>[] = []

  for (const groupId of diff.toAdd) {
    const group = allGroups.find(g => g.id === groupId)
    if (!group) continue
    const current = group.members ?? []
    if (current.includes(uid)) continue
    writes.push(updateGroup(groupId, { members: [...current, uid] }))
  }

  for (const groupId of diff.toRemove) {
    const group = allGroups.find(g => g.id === groupId)
    if (!group) continue
    const current = group.members ?? []
    if (!current.includes(uid)) continue
    writes.push(updateGroup(groupId, { members: current.filter(u => u !== uid) }))
  }

  await Promise.all(writes)
  return writes.length
}

/**
 * Group's `members[]` changed (saved via GroupForm) — sync affected users'
 * `groups[]`, the field access control actually reads.
 */
export async function applyGroupMembersSync(
  groupId: string,
  diff: IdDiff,
  allUsers: { uid: string; groups?: string[] }[],
  updateUser: (uid: string, data: { groups: string[] }) => Promise<unknown>
): Promise<number> {
  const writes: Promise<unknown>[] = []

  for (const uid of diff.toAdd) {
    const user = allUsers.find(u => u.uid === uid)
    if (!user) continue
    const current = user.groups ?? []
    if (current.includes(groupId)) continue
    writes.push(updateUser(uid, { groups: [...current, groupId] }))
  }

  for (const uid of diff.toRemove) {
    const user = allUsers.find(u => u.uid === uid)
    if (!user) continue
    const current = user.groups ?? []
    if (!current.includes(groupId)) continue
    writes.push(updateUser(uid, { groups: current.filter(g => g !== groupId) }))
  }

  await Promise.all(writes)
  return writes.length
}
