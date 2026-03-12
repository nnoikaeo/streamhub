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
