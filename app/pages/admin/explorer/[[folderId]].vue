<script setup lang="ts">
/**
 * Admin Explorer Page — Full File Explorer Style
 *
 * Route: /admin/explorer           → root (all top-level folders)
 * Route: /admin/explorer/:folderId → contents of a specific folder
 *
 * Layout:
 *   Left panel : FolderTree for navigation
 *   Right panel: ExplorerContentsPanel (subfolders + dashboards)
 *
 * Features:
 * - Navigate by clicking folders in tree or double-clicking in contents panel
 * - Clickable breadcrumb showing current path
 * - CRUD for folders and dashboards in the current folder context
 * - Admin: full access | Moderator: assigned folders only (TODO: add moderator middleware)
 *
 * Components used:
 * - FolderTree          : left panel (existing component)
 * - ExplorerContentsPanel: right panel (new component)
 * - FolderForm          : create/edit folder modal
 * - DashboardForm       : create/edit dashboard modal
 * - FormModal           : modal wrapper
 * - ConfirmDialog       : delete confirmation
 *
 * Composables used:
 * - useAdminFolders     : CRUD + buildFolderTree
 * - useAdminDashboards  : CRUD
 * - useAdminBreadcrumbs : top-level page breadcrumb for PageLayout
 * - useAuthStore        : role check (admin vs moderator)
 */

import PageLayout from '~/components/compositions/PageLayout.vue'
import ExplorerContentsPanel from '~/components/admin/ExplorerContentsPanel.vue'
import FolderForm from '~/components/admin/forms/FolderForm.vue'
import DashboardForm from '~/components/admin/forms/DashboardForm.vue'
import type { Folder, Dashboard } from '~/types/dashboard'
import { useAdminFolders } from '~/composables/useAdminFolders'
import { useAdminDashboards } from '~/composables/useAdminDashboards'
import { useAdminBreadcrumbs } from '~/composables/useAdminBreadcrumbs'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  middleware: ['auth', 'admin'],
  layout: 'default',
})

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { breadcrumbs } = useAdminBreadcrumbs()

const {
  folders,
  loading: foldersLoading,
  fetchFolders,
  createFolder,
  updateFolder,
  deleteFolder,
  buildFolderTree,
} = useAdminFolders()

const {
  dashboards,
  loading: dashboardsLoading,
  fetchDashboards,
  createDashboard,
  updateDashboard,
  deleteDashboard,
} = useAdminDashboards()

// ─── Current location ─────────────────────────────────────────────────────

/** Folder ID from URL param. null = root */
const currentFolderId = computed<string | null>(() => {
  const id = route.params.folderId
  if (!id || (Array.isArray(id) && !id[0])) return null
  return Array.isArray(id) ? (id[0] || null) : (id || null)
})

const isAdmin = computed(() => authStore.user?.role === 'admin')
const loading = computed(() => foldersLoading.value || dashboardsLoading.value)

// ─── Tree & breadcrumb ─────────────────────────────────────────────────────

/** Flat → tree for FolderTree component and sidebar */
const folderTree = computed(() => buildFolderTree(folders.value))

/** Path from root to current folder — for breadcrumb */
const folderPath = computed<Folder[]>(() => {
  if (!currentFolderId.value) return []
  const path: Folder[] = []
  let id: string | null | undefined = currentFolderId.value
  while (id) {
    const folder = folders.value.find(f => f.id === id)
    if (!folder) break
    path.unshift(folder)
    id = folder.parentId ?? null
  }
  return path
})

// ─── FolderTree expand state (controlled mode) ────────────────────────────

/**
 * Controlled expand state for FolderTree in left panel.
 * We create a new Set on each toggle so Vue detects the change.
 */
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

/**
 * Auto-expand all ancestor folders when navigating to a folder.
 * Watches both folderPath and folders so it fires once data is loaded.
 */
watch([folderPath, folders], ([path]) => {
  if (path.length === 0) return
  const newSet = new Set(expandedFolders.value)
  path.forEach(f => newSet.add(f.id))
  expandedFolders.value = newSet
})

// ─── Global search ─────────────────────────────────────────────────────────

type SearchResult =
  | { type: 'folder'; item: Folder; pathLabel: string }
  | { type: 'dashboard'; item: Dashboard; pathLabel: string }

const globalSearch = ref('')
const showDropdown = computed(() => globalSearch.value.trim().length > 0)

function buildItemPath(folderId: string | null): string {
  const parts: string[] = []
  let id = folderId
  while (id) {
    const folder = folders.value.find(f => f.id === id)
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
  for (const folder of folders.value) {
    if (folder.name.toLowerCase().includes(q)) {
      results.push({ type: 'folder', item: folder, pathLabel: buildItemPath(folder.parentId ?? null) })
    }
  }
  for (const dashboard of dashboards.value) {
    if (dashboard.name.toLowerCase().includes(q)) {
      results.push({ type: 'dashboard', item: dashboard, pathLabel: buildItemPath(dashboard.folderId) })
    }
  }
  return results
})

const handleSearchSelect = (result: SearchResult) => {
  globalSearch.value = ''
  if (result.type === 'folder') {
    router.push(`/admin/explorer/${result.item.id}`)
  } else {
    router.push(`/dashboard/${result.item.id}`)
  }
}

// ─── Contents of current folder ───────────────────────────────────────────

const currentSubfolders = computed(() =>
  folders.value.filter(f => (f.parentId ?? null) === currentFolderId.value)
)

const currentDashboards = computed(() =>
  dashboards.value.filter(d => d.folderId === currentFolderId.value)
)

// ─── Modal state ───────────────────────────────────────────────────────────

const showFolderModal = ref(false)
const showDashboardModal = ref(false)
const showDeleteDialog = ref(false)

const selectedFolder = ref<Folder | null>(null)
const selectedDashboard = ref<Dashboard | null>(null)

const folderFormRef = ref<{ submit: () => Promise<void> } | null>(null)
const dashboardFormRef = ref<{ submit: () => Promise<void> } | null>(null)

type DeleteTarget = { type: 'folder'; item: Folder } | { type: 'dashboard'; item: Dashboard }
const deleteTarget = ref<DeleteTarget | null>(null)

const deleteDialogTitle = computed(() =>
  deleteTarget.value?.type === 'folder' ? 'ลบโฟลเดอร์' : 'ลบแดชบอร์ด'
)
const deleteDialogMessage = computed(() =>
  deleteTarget.value ? `คุณแน่ใจว่าต้องการลบ '${deleteTarget.value.item.name}' หรือไม่?` : ''
)

// ─── Navigation ────────────────────────────────────────────────────────────

const navigateToFolder = (folder: Folder) => {
  router.push(`/admin/explorer/${folder.id}`)
}

const handleOpenDashboard = (dashboard: Dashboard) => {
  router.push(`/dashboard/${dashboard.id}`)
}

// ─── CRUD handlers ─────────────────────────────────────────────────────────

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
      await updateFolder(selectedFolder.value.id, formData)
    } else {
      await createFolder({ ...formData, parentId: currentFolderId.value })
    }
    showFolderModal.value = false
  } catch (error) {
    console.error('❌ [Explorer] Error saving folder:', error)
  }
}

const handleSaveDashboard = async (formData: Partial<Dashboard>) => {
  try {
    if (selectedDashboard.value) {
      await updateDashboard(selectedDashboard.value.id, formData)
    } else {
      await createDashboard({ ...formData, folderId: formData.folderId || currentFolderId.value || '' })
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
      await deleteFolder(deleteTarget.value.item.id)
    } else {
      await deleteDashboard(deleteTarget.value.item.id)
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

// ─── Lifecycle ─────────────────────────────────────────────────────────────

onMounted(async () => {
  await Promise.all([fetchFolders(), fetchDashboards()])
})
</script>

<template>
  <PageLayout
    :folders="folderTree"
    :allow-search="false"
    :allow-create="false"
    :breadcrumbs="breadcrumbs"
  >
    <div class="explorer-page">

      <!-- Breadcrumb Navigation -->
      <nav class="explorer-breadcrumb" aria-label="Folder path">
        <NuxtLink to="/admin/explorer" class="breadcrumb-item">
          🏠 Root
        </NuxtLink>
        <template v-for="folder in folderPath" :key="folder.id">
          <span class="breadcrumb-sep" aria-hidden="true">›</span>
          <NuxtLink :to="`/admin/explorer/${folder.id}`" class="breadcrumb-item">
            {{ folder.name }}
          </NuxtLink>
        </template>
      </nav>

      <!-- Global Search -->
      <div class="explorer-search-wrapper">
        <div class="explorer-search-box">
          <svg class="search-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M15.5 14h-.79l-.28-.27A6.5 6.5 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
          <input
            v-model="globalSearch"
            type="search"
            class="explorer-search-input"
            placeholder="ค้นหา folder หรือ dashboard ทั้งหมด..."
            aria-label="ค้นหาทั้งหมด"
          />
        </div>
        <!-- Dropdown Results -->
        <div v-if="showDropdown" class="search-dropdown">
          <div v-if="searchResults.length === 0" class="search-empty">
            ไม่พบรายการที่ตรงกับ "{{ globalSearch }}"
          </div>
          <button
            v-for="(result, i) in searchResults"
            :key="i"
            class="search-result-item"
            @mousedown.prevent="handleSearchSelect(result)"
          >
            <span :class="['result-icon', result.type === 'folder' ? 'result-icon--folder' : 'result-icon--dashboard']">
              <svg v-if="result.type === 'folder'" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
              </svg>
            </span>
            <span class="result-details">
              <span class="result-name">{{ result.item.name }}</span>
              <span class="result-path">{{ result.pathLabel }}</span>
            </span>
            <span :class="['result-badge', result.type === 'folder' ? 'result-badge--folder' : 'result-badge--dashboard']">
              {{ result.type === 'folder' ? 'Folder' : 'Dashboard' }}
            </span>
          </button>
        </div>
      </div>

      <!-- Two-pane Layout -->
      <div class="explorer-layout">

        <!-- Left Panel: Folder Tree -->
        <div class="explorer-tree-panel">
          <div class="tree-panel-header">
            <span class="tree-panel-title">โฟลเดอร์</span>
          </div>
          <div class="tree-panel-body">
            <FolderTree
              :folders="folderTree"
              :selected-folder-id="currentFolderId"
              :expanded-folders="expandedFolders"
              @select="navigateToFolder"
              @expand="handleFolderExpand"
            />
          </div>
        </div>

        <!-- Right Panel: Contents -->
        <ExplorerContentsPanel
          :subfolders="currentSubfolders"
          :dashboards="currentDashboards"
          :is-admin="isAdmin"
          :loading="loading"
          :current-folder-id="currentFolderId"
          @new-folder="handleNewFolder"
          @new-dashboard="handleNewDashboard"
          @edit-folder="handleEditFolder"
          @edit-dashboard="handleEditDashboard"
          @delete-folder="handleDeleteFolder"
          @delete-dashboard="handleDeleteDashboard"
          @navigate-folder="navigateToFolder"
          @open-dashboard="handleOpenDashboard"
        />
      </div>

      <!-- Folder Form Modal -->
      <FormModal
        v-model="showFolderModal"
        :title="selectedFolder ? 'แก้ไขโฟลเดอร์' : 'โฟลเดอร์ใหม่'"
        :loading="foldersLoading"
        @save="folderFormRef?.submit()"
        @cancel="showFolderModal = false"
      >
        <FolderForm
          ref="folderFormRef"
          :folder="selectedFolder"
          :all-folders="folders"
          @submit="handleSaveFolder"
        />
      </FormModal>

      <!-- Dashboard Form Modal -->
      <FormModal
        v-model="showDashboardModal"
        :title="selectedDashboard ? 'แก้ไขแดชบอร์ด' : 'แดชบอร์ดใหม่'"
        :loading="dashboardsLoading"
        @save="dashboardFormRef?.submit()"
        @cancel="showDashboardModal = false"
      >
        <DashboardForm
          ref="dashboardFormRef"
          :dashboard="selectedDashboard"
          @submit="handleSaveDashboard"
        />
      </FormModal>

      <!-- Delete Confirmation Dialog -->
      <ConfirmDialog
        :is-open="showDeleteDialog"
        :title="deleteDialogTitle"
        :message="deleteDialogMessage"
        :loading="loading"
        confirm-text="ลบ"
        :is-danger="true"
        @confirm="confirmDelete"
        @cancel="cancelDelete"
      />

    </div>
  </PageLayout>
</template>

<style scoped>
.explorer-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 4rem);
  padding: var(--spacing-lg, 1.25rem);
  gap: var(--spacing-md, 1rem);
}

/* ── Breadcrumb ── */
.explorer-breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  flex-shrink: 0;
  padding: var(--spacing-sm, 0.5rem) var(--spacing-md, 1rem);
  background: var(--color-bg-primary, #fff);
  border-radius: var(--radius-md, 0.375rem);
  border: 1px solid var(--color-border-light, #e5e7eb);
  font-size: 0.875rem;
  flex-wrap: wrap;
}

.breadcrumb-item {
  color: var(--color-primary, #3b82f6);
  text-decoration: none;
  font-weight: 500;
  border-radius: var(--radius-sm, 0.25rem);
  padding: 0.125rem 0.25rem;
  transition: background 0.12s ease, color 0.12s ease;
}

.breadcrumb-item:hover {
  background: #eff6ff;
  color: var(--color-primary-dark, #1d4ed8);
}

.breadcrumb-sep {
  color: var(--color-text-secondary, #9ca3af);
  user-select: none;
}

/* ── Two-pane Layout ── */
.explorer-layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: var(--spacing-md, 1rem);
  flex: 1;
  min-height: 0;
}

/* ── Left Panel: Folder Tree ── */
.explorer-tree-panel {
  display: flex;
  flex-direction: column;
  background: var(--color-bg-primary, #fff);
  border-radius: var(--radius-lg, 0.5rem);
  border: 1px solid var(--color-border-light, #e5e7eb);
  overflow: hidden;
}

.tree-panel-header {
  padding: var(--spacing-sm, 0.5rem) var(--spacing-md, 1rem);
  border-bottom: 1px solid var(--color-border-light, #e5e7eb);
  background: var(--color-bg-secondary, #f9fafb);
  flex-shrink: 0;
}

.tree-panel-title {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary, #6b7280);
}

.tree-panel-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-xs, 0.25rem) 0;
}

/* ── Responsive ── */
@media (max-width: 1024px) {
  .explorer-layout {
    grid-template-columns: 220px 1fr;
  }
}

@media (max-width: 768px) {
  .explorer-page {
    height: auto;
    padding: var(--spacing-md, 1rem);
  }

  .explorer-layout {
    grid-template-columns: 1fr;
  }

  .explorer-tree-panel {
    max-height: 180px;
  }
}

/* ── Global Search ── */
.explorer-search-wrapper {
  position: relative;
  flex-shrink: 0;
}

.explorer-search-box {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm, 0.5rem);
  padding: 0 var(--spacing-md, 1rem);
  background: #ffffff;
  border-radius: var(--radius-md, 0.375rem);
  border: 1px solid var(--color-border-light, #e5e7eb);
  transition: border-color 0.12s ease;

  &:focus-within {
    border-color: var(--color-primary, #3b82f6);
  }
}

.search-icon {
  width: 1rem;
  height: 1rem;
  color: var(--color-text-secondary, #9ca3af);
  flex-shrink: 0;
}

.explorer-search-input {
  flex: 1;
  height: 2.25rem;
  border: none;
  outline: none;
  background: #ffffff;
  font-size: 0.875rem;
  color: #1f2937;

  &::placeholder {
    color: var(--color-text-secondary, #9ca3af);
  }
}

.search-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: #ffffff;
  border: 1px solid var(--color-border-light, #e5e7eb);
  border-radius: var(--radius-md, 0.375rem);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  z-index: 100;
  max-height: 320px;
  overflow-y: auto;
}

.search-empty {
  padding: var(--spacing-md, 1rem);
  font-size: 0.875rem;
  color: var(--color-text-secondary, #6b7280);
  text-align: center;
}

.search-result-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm, 0.5rem);
  width: 100%;
  padding: var(--spacing-sm, 0.5rem) var(--spacing-md, 1rem);
  border: none;
  border-radius: 0;
  background-color: #ffffff;
  color: var(--color-text-primary, #1f2937);
  cursor: pointer;
  text-align: left;
  transition: background-color 0.1s ease;

  &:hover {
    background-color: var(--color-bg-secondary, #f9fafb);
  }

  & + & {
    border-top: 1px solid var(--color-border-light, #e5e7eb);
  }
}

.result-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.125rem;
  height: 1.125rem;
  flex-shrink: 0;

  svg {
    width: 100%;
    height: 100%;
    fill: currentColor;
  }
}

.result-icon--folder   { color: #f59e0b; }
.result-icon--dashboard { color: #3b82f6; }

.result-details {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.result-name {
  font-size: 0.875rem;
  color: var(--color-text-primary, #1f2937);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-path {
  font-size: 0.75rem;
  color: var(--color-text-secondary, #6b7280);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.4rem;
  border-radius: 9999px;
  font-size: 0.7rem;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}

.result-badge--folder    { background: #eff6ff; color: #1d4ed8; }
.result-badge--dashboard { background: #f0fdf4; color: #15803d; }
</style>
