/**
 * Admin Folders Management Composable
 *
 * Wrapper around the generic useAdminResource composable for managing folders
 * Handles hierarchical folder structure with extension methods
 *
 * Usage:
 * const { folders, loading, fetchFolders, createFolder, updateFolder, deleteFolder, getChildFolders, getFolderPath, buildFolderTree } = useAdminFolders()
 */

import { useAdminResource } from './useAdminResource'
import type { Folder } from '~/types/dashboard'

type FolderWithChildren = Folder & { children: FolderWithChildren[] }

/**
 * Compute recursive dashboard counts for every folder.
 * For each folder, the count includes dashboards directly in that folder
 * plus all dashboards in its descendant folders.
 *
 * @param folders - flat array of all folders
 * @param dashboards - flat array of all dashboards (each has a folderId)
 * @returns Record mapping folderId → total recursive dashboard count
 */
export function computeRecursiveDashboardCounts(
  folders: Folder[],
  dashboards: { folderId: string }[]
): Record<string, number> {
  // Step 1: count direct dashboards per folder
  const directCount: Record<string, number> = {}
  for (const d of dashboards) {
    directCount[d.folderId] = (directCount[d.folderId] || 0) + 1
  }

  // Step 2: build children lookup
  const childrenMap = new Map<string | null, string[]>()
  for (const f of folders) {
    const parentId = f.parentId ?? null
    if (!childrenMap.has(parentId)) childrenMap.set(parentId, [])
    childrenMap.get(parentId)!.push(f.id)
  }

  // Step 3: recursive sum (post-order traversal with memoization)
  const result: Record<string, number> = {}

  const sumCount = (folderId: string): number => {
    if (result[folderId] !== undefined) return result[folderId]
    let total = directCount[folderId] || 0
    const children = childrenMap.get(folderId) || []
    for (const childId of children) {
      total += sumCount(childId)
    }
    result[folderId] = total
    return total
  }

  for (const f of folders) {
    sumCount(f.id)
  }

  return result
}

/**
 * Converts a flat folder array into a nested tree structure.
 * Shared by all pages that need a folder tree (sidebar, admin pages, etc.)
 */
export function buildFolderTree(flatFolders: Folder[]): FolderWithChildren[] {
  const folderMap = new Map<string, FolderWithChildren>()

  for (const folder of flatFolders) {
    folderMap.set(folder.id, { ...folder, children: [] })
  }

  const rootFolders: FolderWithChildren[] = []

  for (const folder of flatFolders) {
    const node = folderMap.get(folder.id)!
    if (folder.parentId) {
      const parent = folderMap.get(folder.parentId)
      if (parent) {
        parent.children.push(node)
      }
    } else {
      rootFolders.push(node)
    }
  }

  return rootFolders
}

export function useAdminFolders() {
  const resource = useAdminResource<Folder>({
    resourceName: 'folders',
    idKey: 'id',
    displayKey: 'name',
    idPrefix: 'folder_',
    defaults: {
      parentId: null,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    extensions: {
      /**
       * Get child folders of a parent
       */
      getChildFolders: (folders, parentId: string | null) => {
        return folders.value.filter((f: Folder) => f.parentId === parentId)
      },

      /**
       * Get folder path from root to specific folder
       */
      getFolderPath: (folders, folderId: string): Folder[] => {
        const path: Folder[] = []
        let currentId: string | null | undefined = folderId

        while (currentId) {
          const folder = folders.value.find((f: Folder) => f.id === currentId)
          if (!folder) break

          path.unshift(folder)
          currentId = folder.parentId
        }

        return path
      }
    }
  })

  // Create backward-compatible aliases for existing page code
  return {
    folders: resource.items,
    fetchFolders: resource.fetch,
    createFolder: resource.create,
    updateFolder: resource.update,
    deleteFolder: resource.delete,
    getChildFolders: resource.getChildFolders,
    getFolderPath: resource.getFolderPath,
    buildFolderTree,

    // Also expose generic API for flexibility (includes loading, error, items, fetch, etc.)
    ...resource
  }
}
