/**
 * Admin Folders Management Composable
 * Provides CRUD operations for folders resource
 * Handles hierarchical folder structure
 *
 * Usage:
 * const { folders, loading, fetchFolders, createFolder, updateFolder, deleteFolder } = useAdminFolders()
 */

import type { Folder } from '~/types/dashboard'

export function useAdminFolders() {
  const folders = ref<Folder[]>([])
  const loading = ref(false)
  const error = ref<Error | null>(null)

  /**
   * Fetch all folders
   */
  const fetchFolders = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<{
        success: boolean
        data: Folder[]
        total: number
      }>('/api/mock/folders')

      if (response.success) {
        folders.value = response.data || []
        console.log(`✅ Loaded ${folders.value.length} folders`)
      }
    } catch (e: any) {
      error.value = e
      console.error('❌ Error fetching folders:', e.message)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Create new folder
   */
  const createFolder = async (folderData: Partial<Folder>) => {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<{
        success: boolean
        data: Folder
        action: string
      }>('/api/mock/folders', {
        method: 'POST',
        body: {
          id: folderData.id || `folder_${Date.now()}`,
          name: folderData.name,
          parentId: folderData.parentId || null,
          company: folderData.company,
          description: folderData.description,
          createdBy: folderData.createdBy,
          createdAt: folderData.createdAt || new Date().toISOString(),
          updatedAt: folderData.updatedAt || new Date().toISOString(),
          updatedBy: folderData.updatedBy,
          ...folderData
        }
      })

      if (response.success) {
        console.log(`✅ Folder "${folderData.name}" created`)
        await fetchFolders() // Refresh list
        return response.data
      }
    } catch (e: any) {
      error.value = e
      console.error('❌ Error creating folder:', e.message)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Update existing folder
   */
  const updateFolder = async (id: string, updates: Partial<Folder>) => {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<{
        success: boolean
        data: Folder
        action: string
      }>('/api/mock/folders', {
        method: 'POST',
        body: {
          id,
          ...updates
        }
      })

      if (response.success) {
        console.log(`✅ Folder "${id}" updated`)
        await fetchFolders() // Refresh list
        return response.data
      }
    } catch (e: any) {
      error.value = e
      console.error('❌ Error updating folder:', e.message)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete folder by id
   */
  const deleteFolder = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<{
        success: boolean
        deleted: boolean
        message: string
      }>(`/api/mock/folders/${id}`, {
        method: 'DELETE'
      })

      if (response.success) {
        console.log(`✅ Folder "${id}" deleted`)
        await fetchFolders() // Refresh list
        return true
      }
    } catch (e: any) {
      error.value = e
      console.error('❌ Error deleting folder:', e.message)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Get child folders of a parent
   */
  const getChildFolders = (parentId: string | null) => {
    return folders.value.filter(f => f.parentId === parentId)
  }

  /**
   * Get folder path from root to specific folder
   */
  const getFolderPath = (folderId: string): Folder[] => {
    const path: Folder[] = []
    let currentId: string | null | undefined = folderId

    while (currentId) {
      const folder = folders.value.find(f => f.id === currentId)
      if (!folder) break

      path.unshift(folder)
      currentId = folder.parentId
    }

    return path
  }

  return {
    // State (readonly)
    folders: readonly(folders),
    loading: readonly(loading),
    error: readonly(error),

    // Actions
    fetchFolders,
    createFolder,
    updateFolder,
    deleteFolder,
    getChildFolders,
    getFolderPath,
  }
}
