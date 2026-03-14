/**
 * Moderator Folders Composable
 *
 * Provides access to folders that the current moderator is assigned to manage,
 * including all subfolders within those assigned folders.
 *
 * Usage:
 * const { assignedFolders, assignedFolderTree, fetchFolders, getDashboardCount, canManageFolder, loading } = useModeratorFolders()
 */

import { computed } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useAdminFolders } from './useAdminFolders'
import { useAdminDashboards } from './useAdminDashboards'
import type { Folder } from '~/types/dashboard'

type FolderWithChildren = Folder & { children: FolderWithChildren[] }

export function useModeratorFolders() {
  const authStore = useAuthStore()
  const { folders, fetchFolders, loading } = useAdminFolders()
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
   * Count dashboards directly inside a given folder
   */
  const getDashboardCount = (folderId: string): number => {
    return dashboards.value.filter(d => d.folderId === folderId).length
  }

  return {
    assignedFolders,
    assignedFolderTree,
    fetchFolders,
    getDashboardCount,
    canManageFolder,
    loading
  }
}
