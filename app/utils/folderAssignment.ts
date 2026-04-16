/**
 * Folder Assignment Utilities
 *
 * Handles syncing a moderator's folder assignments when their role or
 * selected folders change. Called from admin user edit flow.
 *
 * Rules (from admin-user-management-page.md v2.0):
 * - Role moderator → user/admin: remove UID from every folder it was on
 * - Role stays moderator: diff checkboxes, add/remove UID only on changed folders
 * - Role not moderator (and wasn't): no folder writes
 */

import type { Folder } from '~/types/dashboard'

export type UserRole = 'user' | 'moderator' | 'admin'

export interface FolderAssignmentDiff {
  toAdd: string[]    // folder IDs to add uid into assignedModerators
  toRemove: string[] // folder IDs to remove uid from assignedModerators
}

/**
 * Compute which folders need to be updated given role transition and selection.
 *
 * @param uid Moderator's UID
 * @param previousRole Role before this save (from original user doc)
 * @param currentRole Role after this save (from form)
 * @param selectedFolderIds Folders checked in the picker (empty when role ≠ moderator)
 * @param allFolders Every folder in the system (used to find current assignments)
 */
export function diffFolderAssignments(
  uid: string,
  previousRole: UserRole,
  currentRole: UserRole,
  selectedFolderIds: string[],
  allFolders: Folder[]
): FolderAssignmentDiff {
  const currentlyAssignedIds = allFolders
    .filter(f => (f.assignedModerators ?? []).includes(uid))
    .map(f => f.id)

  // Leaving moderator role → strip all assignments
  if (previousRole === 'moderator' && currentRole !== 'moderator') {
    return { toAdd: [], toRemove: currentlyAssignedIds }
  }

  // Not moderator before or after → no folder writes
  if (currentRole !== 'moderator') {
    return { toAdd: [], toRemove: [] }
  }

  // Currently moderator — diff selection vs current assignments
  const selectedSet = new Set(selectedFolderIds)
  const currentSet = new Set(currentlyAssignedIds)

  const toAdd = selectedFolderIds.filter(id => !currentSet.has(id))
  const toRemove = currentlyAssignedIds.filter(id => !selectedSet.has(id))

  return { toAdd, toRemove }
}

/**
 * Apply a folder assignment diff by calling updateFolder for each changed folder.
 * Returns the number of folder writes performed.
 */
export async function applyFolderAssignments(
  uid: string,
  diff: FolderAssignmentDiff,
  allFolders: Folder[],
  updateFolder: (id: string, data: Partial<Folder>) => Promise<Folder | undefined>
): Promise<number> {
  const writes: Promise<unknown>[] = []

  for (const folderId of diff.toAdd) {
    const folder = allFolders.find(f => f.id === folderId)
    if (!folder) continue
    const current = folder.assignedModerators ?? []
    if (current.includes(uid)) continue
    writes.push(updateFolder(folderId, { assignedModerators: [...current, uid] }))
  }

  for (const folderId of diff.toRemove) {
    const folder = allFolders.find(f => f.id === folderId)
    if (!folder) continue
    const current = folder.assignedModerators ?? []
    if (!current.includes(uid)) continue
    writes.push(updateFolder(folderId, { assignedModerators: current.filter(u => u !== uid) }))
  }

  await Promise.all(writes)
  return writes.length
}
