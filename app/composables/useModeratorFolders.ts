/**
 * Moderator Folders Composable
 *
 * Provides access to folders that the current moderator is assigned to manage,
 * including all subfolders within those assigned folders.
 * Includes CRUD operations with permission checks (same pattern as useModeratorDashboards).
 *
 * Usage:
 * const { assignedFolders, assignedFolderTree, manageableFolders, fetchFolders,
 *         createFolder, updateFolder, deleteFolder, canDeleteManagedFolder,
 *         getDashboardCount, canManageFolder, loading } = useModeratorFolders()
 */

import { computed } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useAdminFolders } from './useAdminFolders'
import { useAdminDashboards } from './useAdminDashboards'
import type { Folder } from '~/types/dashboard'

type FolderWithChildren = Folder & { children: FolderWithChildren[] }

export function useModeratorFolders() {
  const authStore = useAuthStore()
  const adminFolders = useAdminFolders()
  const { folders, fetchFolders, loading, buildFolderTree } = adminFolders
  const { dashboards } = useAdminDashboards()

  /**
   * Folders where the current moderator is listed in assignedModerators
   */
  const assignedFolders = computed(() => {
    const uid = authStore.user?.uid
    if (!uid) return []
    return folders.value.filter(f => f.assignedModerators?.includes(uid))
  })

  /**
   * Set of all folder IDs manageable by this moderator:
   * directly assigned folders + all their descendants
   */
  const manageableFolderIds = computed(() => {
    const ids = new Set<string>()

    const addDescendants = (parentId: string) => {
      if (ids.has(parentId)) return
      ids.add(parentId)
      for (const folder of folders.value) {
        if (folder.parentId === parentId) {
          addDescendants(folder.id)
        }
      }
    }

    for (const folder of assignedFolders.value) {
      addDescendants(folder.id)
    }

    return ids
  })

  /**
   * Check if the current moderator can manage a folder.
   * Returns true if the folder is directly assigned or is a descendant of an assigned folder.
   */
  const canManageFolder = (folderId: string): boolean => {
    return manageableFolderIds.value.has(folderId)
  }

  /**
   * Tree of manageable folders.
   * Directly assigned folders (whose parents are not also manageable) are treated as roots.
   */
  const assignedFolderTree = computed((): FolderWithChildren[] => {
    const manageable = folders.value.filter(f => manageableFolderIds.value.has(f.id))

    const folderMap = new Map<string, FolderWithChildren>()
    for (const folder of manageable) {
      folderMap.set(folder.id, { ...folder, children: [] })
    }

    const roots: FolderWithChildren[] = []
    for (const folder of manageable) {
      const node = folderMap.get(folder.id)!
      const parentInTree = folder.parentId && folderMap.has(folder.parentId)
      if (parentInTree) {
        folderMap.get(folder.parentId!)!.children.push(node)
      } else {
        roots.push(node)
      }
    }

    return roots
  })

  /**
   * Flat list of all folders this moderator can manage
   */
  const manageableFolders = computed(() =>
    folders.value.filter(f => manageableFolderIds.value.has(f.id))
  )

  /**
   * Count dashboards directly inside a given folder
   */
  const getDashboardCount = (folderId: string): number => {
    return dashboards.value.filter(d => d.folderId === folderId).length
  }

  /**
   * Create a folder — only allowed if the parent folder is manageable
   */
  const createFolder = async (data: Partial<Folder>): Promise<Folder | undefined> => {
    if (!data.parentId || !canManageFolder(data.parentId)) {
      throw new Error('No permission to create folder in this location')
    }
    return adminFolders.createFolder(data)
  }

  /**
   * Update a folder — only allowed if the folder is manageable
   */
  const updateFolder = async (id: string, data: Partial<Folder>): Promise<Folder | undefined> => {
    if (!canManageFolder(id)) {
      throw new Error('No permission to update this folder')
    }
    return adminFolders.updateFolder(id, data)
  }

  /**
   * Check if moderator can delete a folder.
   * Must be: manageable + created by this moderator + not a directly assigned folder
   */
  const canDeleteManagedFolder = (folderId: string): boolean => {
    const uid = authStore.user?.uid
    if (!uid) return false
    if (!canManageFolder(folderId)) return false

    const folder = folders.value.find(f => f.id === folderId)
    if (!folder) return false

    // Must be created by this moderator
    if (folder.createdBy !== uid) return false

    // Must not be a directly assigned folder (must be a subfolder)
    const isDirectlyAssigned = assignedFolders.value.some(f => f.id === folderId)
    if (isDirectlyAssigned) return false

    return true
  }

  /**
   * Delete a folder — only subfolders created by this moderator
   */
  const deleteFolder = async (id: string): Promise<boolean | undefined> => {
    if (!canDeleteManagedFolder(id)) {
      throw new Error('No permission to delete this folder')
    }
    return adminFolders.deleteFolder(id)
  }

  /**
   * Full folder tree (all folders) — for explorer page to show full structure
   * with non-manageable folders rendered as disabled
   */
  const allFolders = folders
  const allFolderTree = computed(() => buildFolderTree(folders.value))

  return {
    assignedFolders,
    assignedFolderTree,
    manageableFolders,
    manageableFolderIds,
    allFolders,
    allFolderTree,
    fetchFolders,
    buildFolderTree,
    createFolder,
    updateFolder,
    deleteFolder,
    canDeleteManagedFolder,
    getDashboardCount,
    canManageFolder,
    loading
  }
}
