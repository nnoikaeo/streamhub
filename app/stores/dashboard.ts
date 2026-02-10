import { defineStore } from 'pinia'
import type { Dashboard, Folder } from '~/types/dashboard'

/**
 * Dashboard Store - Shared State Management
 *
 * Manages dashboard and folder data that's shared across multiple pages
 * Implements caching and state persistence
 *
 * Strategy 4 Implementation:
 * - Centralized state for dashboards and folders
 * - Reducers for state mutations
 * - Selectors (computed) for efficient data access
 * - Cache management for performance
 */
export const useDashboardStore = defineStore('dashboard', () => {
  // ========== State ==========
  const dashboards = ref<Dashboard[]>([])
  const folders = ref<Folder[]>([])
  const selectedFolderId = ref<string | null>(null)
  const selectedDashboardId = ref<string | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Cache keys for invalidation
  const dashboardsCacheKey = ref<string>('')
  const foldersCacheKey = ref<string>('')

  // ========== Computed - Selectors ==========

  /**
   * Get current folder
   */
  const currentFolder = computed(() => {
    if (!selectedFolderId.value) return null
    return folders.value.find((f) => f.id === selectedFolderId.value) || null
  })

  /**
   * Get current dashboard
   */
  const currentDashboard = computed(() => {
    if (!selectedDashboardId.value) return null
    return dashboards.value.find((d) => d.id === selectedDashboardId.value) || null
  })

  /**
   * Get dashboards count
   */
  const dashboardsCount = computed(() => dashboards.value.length)

  /**
   * Get folders count
   */
  const foldersCount = computed(() => folders.value.length)

  /**
   * Check if data is being loaded
   */
  const isLoadingDashboards = computed(() => isLoading.value && dashboards.value.length === 0)

  // ========== Mutations - Reducers ==========

  /**
   * Set dashboards
   */
  const setDashboards = (newDashboards: Dashboard[]) => {
    dashboards.value = newDashboards
  }

  /**
   * Add dashboard to state (for optimistic updates)
   */
  const addDashboard = (dashboard: Dashboard) => {
    dashboards.value.unshift(dashboard)
  }

  /**
   * Update dashboard in state
   */
  const updateDashboard = (id: string, updates: Partial<Dashboard>) => {
    const index = dashboards.value.findIndex((d) => d.id === id)
    if (index !== -1) {
      dashboards.value[index] = { ...dashboards.value[index], ...updates }
    }
  }

  /**
   * Remove dashboard from state
   */
  const removeDashboard = (id: string) => {
    dashboards.value = dashboards.value.filter((d) => d.id !== id)
  }

  /**
   * Set folders
   */
  const setFolders = (newFolders: Folder[]) => {
    folders.value = newFolders
  }

  /**
   * Add folder to state
   */
  const addFolder = (folder: Folder) => {
    folders.value.push(folder)
  }

  /**
   * Update folder in state
   */
  const updateFolder = (id: string, updates: Partial<Folder>) => {
    const index = folders.value.findIndex((f) => f.id === id)
    if (index !== -1) {
      folders.value[index] = { ...folders.value[index], ...updates }
    }
  }

  /**
   * Remove folder from state
   */
  const removeFolder = (id: string) => {
    folders.value = folders.value.filter((f) => f.id !== id)
  }

  /**
   * Set selected folder
   */
  const selectFolder = (folderId: string | null) => {
    selectedFolderId.value = folderId
  }

  /**
   * Set selected dashboard
   */
  const selectDashboard = (dashboardId: string | null) => {
    selectedDashboardId.value = dashboardId
  }

  /**
   * Set loading state
   */
  const setLoading = (loading: boolean) => {
    isLoading.value = loading
  }

  /**
   * Set error message
   */
  const setError = (errorMsg: string | null) => {
    error.value = errorMsg
  }

  /**
   * Clear error message
   */
  const clearError = () => {
    error.value = null
  }

  // ========== Cache Management ==========

  /**
   * Generate cache key for dashboards (to detect when cache is stale)
   */
  const updateDashboardsCacheKey = (userId: string, folderId: string, company: string) => {
    dashboardsCacheKey.value = `${userId}:${folderId}:${company}`
  }

  /**
   * Generate cache key for folders (to detect when cache is stale)
   */
  const updateFoldersCacheKey = (userId: string, company: string) => {
    foldersCacheKey.value = `${userId}:${company}`
  }

  /**
   * Check if dashboards cache is valid
   */
  const isDashboardsCacheValid = (userId: string, folderId: string, company: string): boolean => {
    const newKey = `${userId}:${folderId}:${company}`
    return dashboardsCacheKey.value === newKey
  }

  /**
   * Check if folders cache is valid
   */
  const isFoldersCacheValid = (userId: string, company: string): boolean => {
    const newKey = `${userId}:${company}`
    return foldersCacheKey.value === newKey
  }

  /**
   * Clear all cache (useful on logout or permission changes)
   */
  const clearCache = () => {
    dashboards.value = []
    folders.value = []
    selectedFolderId.value = null
    selectedDashboardId.value = null
    error.value = null
    dashboardsCacheKey.value = ''
    foldersCacheKey.value = ''
  }

  // ========== Reset ==========

  /**
   * Reset store to initial state
   */
  const reset = () => {
    clearCache()
    isLoading.value = false
  }

  return {
    // State
    dashboards,
    folders,
    selectedFolderId,
    selectedDashboardId,
    isLoading,
    error,

    // Computed - Selectors
    currentFolder,
    currentDashboard,
    dashboardsCount,
    foldersCount,
    isLoadingDashboards,

    // Mutations - Reducers
    setDashboards,
    addDashboard,
    updateDashboard,
    removeDashboard,
    setFolders,
    addFolder,
    updateFolder,
    removeFolder,
    selectFolder,
    selectDashboard,
    setLoading,
    setError,
    clearError,

    // Cache Management
    updateDashboardsCacheKey,
    updateFoldersCacheKey,
    isDashboardsCacheValid,
    isFoldersCacheValid,
    clearCache,

    // Reset
    reset,
  }
})
