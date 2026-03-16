/**
 * Shared Explorer Composable
 *
 * Encapsulates all shared logic for the Explorer page used by both
 * admin (/admin/explorer) and moderator (/manage/explorer).
 *
 * Handles: modal state, CRUD handlers, search, tree expand, folder path computation.
 * Role-specific behavior is controlled via the options parameter.
 *
 * Usage:
 * const explorer = useExplorer({ routePrefix, folders, dashboards, ... })
 */

import { ref, computed, watch, type Ref, type ComputedRef } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import type { Folder, Dashboard } from '~/types/dashboard'

export interface ExplorerOptions {
  /** Route prefix: '/admin/explorer' or '/manage/explorer' */
  routePrefix: string

  /** All folders (flat) — used for path computation and search */
  allFolders: Ref<Folder[]> | ComputedRef<Folder[]>

  /** Folders included in search results */
  searchableFolders: Ref<Folder[]> | ComputedRef<Folder[]>

  /** Dashboards included in search results */
  searchableDashboards: Ref<Dashboard[]> | ComputedRef<Dashboard[]>

  /** CRUD operations */
  createFolder: (data: Partial<Folder>) => Promise<Folder | undefined>
  updateFolder: (id: string, data: Partial<Folder>) => Promise<Folder | undefined>
  deleteFolder: (id: string) => Promise<boolean | undefined>
  createDashboard: (data: Partial<Dashboard>) => Promise<Dashboard | undefined>
  updateDashboard: (id: string, data: Partial<Dashboard>) => Promise<Dashboard | undefined>
  deleteDashboard: (id: string) => Promise<boolean | undefined>

  /**
   * Optional delete validation.
   * Return true if allowed, or an error message string if not.
   */
  canDeleteFolder?: (folder: Folder) => true | string
}

export function useExplorer(options: ExplorerOptions) {
  const router = useRouter()
  const route = useRoute()

  // ─── Current location ─────────────────────────────────────────────────

  /** Folder ID from URL param. null = root */
  const currentFolderId = computed<string | null>(() => {
    const id = route.params.folderId
    if (!id || (Array.isArray(id) && !id[0])) return null
    return Array.isArray(id) ? (id[0] || null) : (id || null)
  })

  // ─── Folder path (breadcrumb) ─────────────────────────────────────────

  /** Path from root to current folder */
  const folderPath = computed<Folder[]>(() => {
    if (!currentFolderId.value) return []
    const path: Folder[] = []
    let id: string | null | undefined = currentFolderId.value
    while (id) {
      const folder = options.allFolders.value.find(f => f.id === id)
      if (!folder) break
      path.unshift(folder)
      id = folder.parentId ?? null
    }
    return path
  })

  // ─── FolderTree expand state (controlled mode) ────────────────────────

  const expandedFolders = ref<Set<string>>(new Set())

  const handleFolderExpand = (folderId: string) => {
    const newSet = new Set(expandedFolders.value)
    if (newSet.has(folderId)) {
      newSet.delete(folderId)
    } else {
      newSet.add(folderId)
    }
    expandedFolders.value = newSet
  }

  /** Auto-expand all ancestor folders when navigating to a folder */
  watch([folderPath, options.allFolders], ([path]) => {
    if (path.length === 0) return
    const newSet = new Set(expandedFolders.value)
    path.forEach(f => newSet.add(f.id))
    expandedFolders.value = newSet
  })

  // ─── Global search ────────────────────────────────────────────────────

  type SearchResult =
    | { type: 'folder'; item: Folder; pathLabel: string }
    | { type: 'dashboard'; item: Dashboard; pathLabel: string }

  const globalSearch = ref('')
  const showDropdown = computed(() => globalSearch.value.trim().length > 0)

  function buildItemPath(folderId: string | null): string {
    const parts: string[] = []
    let id = folderId
    while (id) {
      const folder = options.allFolders.value.find(f => f.id === id)
      if (!folder) break
      parts.unshift(folder.name)
      id = folder.parentId ?? null
    }
    return parts.join(' › ') || 'Root'
  }

  const searchResults = computed<SearchResult[]>(() => {
    const q = globalSearch.value.trim().toLowerCase()
    if (!q) return []
    const results: SearchResult[] = []
    for (const folder of options.searchableFolders.value) {
      if (folder.name.toLowerCase().includes(q)) {
        results.push({ type: 'folder', item: folder, pathLabel: buildItemPath(folder.parentId ?? null) })
      }
    }
    for (const dashboard of options.searchableDashboards.value) {
      if (dashboard.name.toLowerCase().includes(q)) {
        results.push({ type: 'dashboard', item: dashboard, pathLabel: buildItemPath(dashboard.folderId) })
      }
    }
    return results
  })

  const handleSearchSelect = (result: SearchResult) => {
    globalSearch.value = ''
    if (result.type === 'folder') {
      router.push(`${options.routePrefix}/${result.item.id}`)
    } else {
      router.push(`/dashboard/${result.item.id}`)
    }
  }

  // ─── Navigation ───────────────────────────────────────────────────────

  const navigateToFolder = (folder: Folder) => {
    router.push(`${options.routePrefix}/${folder.id}`)
  }

  const handleOpenDashboard = (dashboard: Dashboard) => {
    router.push(`/dashboard/${dashboard.id}`)
  }

  // ─── Modal state ──────────────────────────────────────────────────────

  const showFolderModal = ref(false)
  const showDashboardModal = ref(false)
  const showDeleteDialog = ref(false)

  const selectedFolder = ref<Folder | null>(null)
  const selectedDashboard = ref<Dashboard | null>(null)

  type DeleteTarget = { type: 'folder'; item: Folder } | { type: 'dashboard'; item: Dashboard }
  const deleteTarget = ref<DeleteTarget | null>(null)

  const deleteDialogTitle = computed(() =>
    deleteTarget.value?.type === 'folder' ? 'ลบโฟลเดอร์' : 'ลบแดชบอร์ด'
  )
  const deleteDialogMessage = computed(() =>
    deleteTarget.value ? `คุณแน่ใจว่าต้องการลบ '${deleteTarget.value.item.name}' หรือไม่?` : ''
  )

  // ─── CRUD handlers ────────────────────────────────────────────────────

  const handleNewFolder = () => {
    selectedFolder.value = null
    showFolderModal.value = true
  }

  const handleNewDashboard = () => {
    selectedDashboard.value = null
    showDashboardModal.value = true
  }

  const handleEditFolder = (folder: Folder) => {
    selectedFolder.value = folder
    showFolderModal.value = true
  }

  const handleEditDashboard = (dashboard: Dashboard) => {
    selectedDashboard.value = dashboard
    showDashboardModal.value = true
  }

  const handleDeleteFolder = (folder: Folder) => {
    if (options.canDeleteFolder) {
      const result = options.canDeleteFolder(folder)
      if (result !== true) {
        alert(result)
        return
      }
    }
    deleteTarget.value = { type: 'folder', item: folder }
    showDeleteDialog.value = true
  }

  const handleDeleteDashboard = (dashboard: Dashboard) => {
    deleteTarget.value = { type: 'dashboard', item: dashboard }
    showDeleteDialog.value = true
  }

  const handleSaveFolder = async (formData: Partial<Folder>) => {
    try {
      if (selectedFolder.value) {
        await options.updateFolder(selectedFolder.value.id, formData)
      } else {
        await options.createFolder({ ...formData, parentId: currentFolderId.value })
      }
      showFolderModal.value = false
    } catch (error) {
      console.error('❌ [Explorer] Error saving folder:', error)
    }
  }

  const handleSaveDashboard = async (formData: Partial<Dashboard>) => {
    try {
      if (selectedDashboard.value) {
        await options.updateDashboard(selectedDashboard.value.id, formData)
      } else {
        await options.createDashboard({ ...formData, folderId: formData.folderId || currentFolderId.value || '' })
      }
      showDashboardModal.value = false
    } catch (error) {
      console.error('❌ [Explorer] Error saving dashboard:', error)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget.value) return
    try {
      if (deleteTarget.value.type === 'folder') {
        await options.deleteFolder(deleteTarget.value.item.id)
      } else {
        await options.deleteDashboard(deleteTarget.value.item.id)
      }
      showDeleteDialog.value = false
      deleteTarget.value = null
    } catch (error) {
      console.error('❌ [Explorer] Error deleting item:', error)
    }
  }

  const cancelDelete = () => {
    showDeleteDialog.value = false
    deleteTarget.value = null
  }

  return {
    // Location
    currentFolderId,
    folderPath,

    // Tree expand
    expandedFolders,
    handleFolderExpand,

    // Search
    globalSearch,
    showDropdown,
    searchResults,
    handleSearchSelect,

    // Navigation
    navigateToFolder,
    handleOpenDashboard,

    // Modals
    showFolderModal,
    showDashboardModal,
    showDeleteDialog,
    selectedFolder,
    selectedDashboard,
    deleteTarget,
    deleteDialogTitle,
    deleteDialogMessage,

    // CRUD
    handleNewFolder,
    handleNewDashboard,
    handleEditFolder,
    handleEditDashboard,
    handleDeleteFolder,
    handleDeleteDashboard,
    handleSaveFolder,
    handleSaveDashboard,
    confirmDelete,
    cancelDelete,

    // Helpers
    routePrefix: options.routePrefix,
  }
}
