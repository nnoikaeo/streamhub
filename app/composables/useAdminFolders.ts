/**
 * Admin Folders Management Composable
 *
 * Wrapper around the generic useAdminResource composable for managing folders
 * Handles hierarchical folder structure with extension methods
 *
 * Usage:
 * const { items: folders, loading, fetch, create, update, delete, getChildFolders, getFolderPath } = useAdminFolders()
 */

import { useAdminResource } from './useAdminResource'
import type { Folder } from '~/types/dashboard'

export function useAdminFolders() {
  const resource = useAdminResource<Folder>({
    resourceName: 'folders',
    idKey: 'id',
    displayKey: 'name',
    idPrefix: 'folder_',
    defaults: {
      parentId: null,
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
    loading: resource.loading,
    error: resource.error,
    fetchFolders: resource.fetch,
    createFolder: resource.create,
    updateFolder: resource.update,
    deleteFolder: resource.delete,
    getChildFolders: resource.getChildFolders,
    getFolderPath: resource.getFolderPath,

    // Also expose generic API for flexibility
    ...resource
  }
}
