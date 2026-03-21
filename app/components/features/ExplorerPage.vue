<script setup lang="ts">
/**
 * ExplorerPage — Shared Explorer Component
 *
 * Used by both admin (/admin/explorer) and moderator (/manage/explorer).
 * Provides the full two-pane file explorer UI with folder tree, contents panel,
 * breadcrumb navigation, search, and CRUD modals.
 *
 * Role-specific behavior is controlled via props and the useExplorer composable.
 */

import PageLayout from '~/components/compositions/PageLayout.vue'
import ExplorerContentsPanel from '~/components/admin/ExplorerContentsPanel.vue'
import ModeratorAssignmentModal from '~/components/admin/ModeratorAssignmentModal.vue'
import FolderForm from '~/components/admin/forms/FolderForm.vue'
import DashboardForm from '~/components/admin/forms/DashboardForm.vue'
import type { Folder, Dashboard, User } from '~/types/dashboard'
import type { Tag } from '~/types/tag'
import type { useExplorer } from '~/composables/useExplorer'

interface Props {
  /** Explorer composable instance (from useExplorer) */
  explorer: ReturnType<typeof useExplorer>

  /** Folder tree data for FolderTree left panel */
  folderTree: Folder[]

  /** Subfolders of the current folder (displayed in contents panel) */
  currentSubfolders: Folder[]

  /** Dashboards in the current folder (displayed in contents panel) */
  currentDashboards: Dashboard[]

  /** Overall loading state */
  loading: boolean

  /** Whether the user can create folders/dashboards in the current folder */
  canCreateInCurrentFolder: boolean

  /** PageLayout breadcrumbs */
  breadcrumbs: { label: string; to?: string }[]

  /** Folders to show in FolderForm parent selector */
  folderFormFolders: Folder[]

  /** Optional: disabled folder IDs in tree (for moderator) */
  disabledFolderIds?: Set<string>

  /** Optional: loading state for folders (used in folder modal) */
  foldersLoading?: boolean

  /** Optional: loading state for dashboards (used in dashboard modal) */
  dashboardsLoading?: boolean

  // DashboardForm extra props
  showTagSelector?: boolean
  canCreateTag?: boolean
  availableTags?: Tag[]
  availableFolders?: Folder[]

  // Moderator assignment (admin only)
  showModeratorColumn?: boolean
  allUsers?: User[]
  onSaveModerators?: (folderId: string, moderatorUids: string[]) => Promise<void>

  /** Recursive dashboard counts per folder (passed to FolderTree + ContentsPanel) */
  dashboardCounts?: Record<string, number>
}

const props = withDefaults(defineProps<Props>(), {
  showTagSelector: false,
  canCreateTag: false,
  availableTags: () => [],
  foldersLoading: false,
  dashboardsLoading: false,
  showModeratorColumn: false,
})

// Local template refs for form components
const folderFormRef = ref<{ submit: () => Promise<void> } | null>(null)
const dashboardFormRef = ref<{ submit: () => Promise<void> } | null>(null)

// Moderator assignment modal state
const showModeratorModal = ref(false)
const moderatorTargetFolder = ref<Folder | null>(null)
const moderatorSaving = ref(false)

const handleManageModerators = (folder: Folder) => {
  moderatorTargetFolder.value = folder
  showModeratorModal.value = true
}

// Navigate to permissions page with dashboard pre-selected
const router = useRouter()
const handleManagePermissions = (dashboard: Dashboard) => {
  const permissionsPath = props.explorer.routePrefix.replace('/explorer', '/permissions')
  router.push({ path: permissionsPath, query: { dashboard: dashboard.id } })
}

// Navigate to permissions page with folder pre-filter
const handleManageFolderPermissions = (folder: Folder) => {
  const permissionsPath = props.explorer.routePrefix.replace('/explorer', '/permissions')
  router.push({ path: permissionsPath, query: { folder: folder.id } })
}

const handleSaveModerators = async (folderId: string, moderatorUids: string[]) => {
  if (!props.onSaveModerators) return
  moderatorSaving.value = true
  try {
    await props.onSaveModerators(folderId, moderatorUids)
    showModeratorModal.value = false
  } finally {
    moderatorSaving.value = false
  }
}
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
        <NuxtLink :to="explorer.routePrefix" class="breadcrumb-item">
          🏠 Root
        </NuxtLink>
        <template v-for="folder in explorer.folderPath.value" :key="folder.id">
          <span class="breadcrumb-sep" aria-hidden="true">›</span>
          <NuxtLink :to="`${explorer.routePrefix}/${folder.id}`" class="breadcrumb-item">
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
            v-model="explorer.globalSearch.value"
            type="search"
            class="explorer-search-input"
            placeholder="ค้นหาโฟลเดอร์หรือแดชบอร์ดทั้งหมด..."
            aria-label="ค้นหาทั้งหมด"
          />
        </div>
        <!-- Dropdown Results -->
        <div v-if="explorer.showDropdown.value" class="search-dropdown">
          <div v-if="explorer.searchResults.value.length === 0" class="search-empty">
            ไม่พบรายการที่ตรงกับ "{{ explorer.globalSearch.value }}"
          </div>
          <div
            v-for="(result, i) in explorer.searchResults.value"
            :key="i"
            class="search-result-item"
            @mousedown.prevent="explorer.handleSearchSelect(result)"
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
            <button
              v-if="result.type === 'dashboard'"
              class="result-action-btn"
              title="จัดการสิทธิ์"
              @mousedown.prevent.stop="handleManagePermissions(result.item as Dashboard)"
            >🔑</button>
            <span :class="['result-badge', result.type === 'folder' ? 'result-badge--folder' : 'result-badge--dashboard']">
              {{ result.type === 'folder' ? 'Folder' : 'Dashboard' }}
            </span>
          </div>
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
              :selected-folder-id="explorer.currentFolderId.value"
              :expanded-folders="explorer.expandedFolders.value"
              :disabled-folder-ids="disabledFolderIds"
              :dashboard-counts="dashboardCounts"
              @select="explorer.navigateToFolder"
              @expand="explorer.handleFolderExpand"
            />
          </div>
        </div>

        <!-- Right Panel: Contents -->
        <ExplorerContentsPanel
          :subfolders="currentSubfolders"
          :dashboards="currentDashboards"
          :is-admin="canCreateInCurrentFolder"
          :loading="loading"
          :current-folder-id="explorer.currentFolderId.value"
          :all-users="allUsers"
          :show-moderator-column="showModeratorColumn"
          :dashboard-counts="dashboardCounts"
          @new-folder="explorer.handleNewFolder"
          @new-dashboard="explorer.handleNewDashboard"
          @edit-folder="explorer.handleEditFolder"
          @edit-dashboard="explorer.handleEditDashboard"
          @delete-folder="explorer.handleDeleteFolder"
          @delete-dashboard="explorer.handleDeleteDashboard"
          @navigate-folder="explorer.navigateToFolder"
          @open-dashboard="explorer.handleOpenDashboard"
          @manage-moderators="handleManageModerators"
          @manage-permissions="handleManagePermissions"
          @manage-folder-permissions="handleManageFolderPermissions"
        />
      </div>

      <!-- Folder Form Modal -->
      <FormModal
        v-model="explorer.showFolderModal.value"
        :title="explorer.selectedFolder.value ? 'แก้ไขโฟลเดอร์' : 'โฟลเดอร์ใหม่'"
        :loading="foldersLoading"
        @save="folderFormRef?.submit()"
        @cancel="explorer.showFolderModal.value = false"
      >
        <FolderForm
          ref="folderFormRef"
          :folder="explorer.selectedFolder.value"
          :all-folders="folderFormFolders"
          :parent-folder-id="explorer.currentFolderId.value"
          @submit="explorer.handleSaveFolder"
        />
      </FormModal>

      <!-- Dashboard Form Modal -->
      <FormModal
        v-model="explorer.showDashboardModal.value"
        :title="explorer.selectedDashboard.value ? 'แก้ไขแดชบอร์ด' : 'แดชบอร์ดใหม่'"
        :loading="dashboardsLoading"
        @save="dashboardFormRef?.submit()"
        @cancel="explorer.showDashboardModal.value = false"
      >
        <DashboardForm
          ref="dashboardFormRef"
          :dashboard="explorer.selectedDashboard.value"
          :default-folder-id="explorer.currentFolderId.value"
          :show-tag-selector="showTagSelector"
          :can-create-tag="canCreateTag"
          :available-tags="availableTags"
          :available-folders="availableFolders"
          :all-users="allUsers"
          @submit="explorer.handleSaveDashboard"
        />
      </FormModal>

      <!-- Delete Confirmation Dialog -->
      <ConfirmDialog
        :is-open="explorer.showDeleteDialog.value"
        :title="explorer.deleteDialogTitle.value"
        :message="explorer.deleteDialogMessage.value"
        :loading="loading"
        confirm-text="ลบ"
        :is-danger="true"
        @confirm="explorer.confirmDelete"
        @cancel="explorer.cancelDelete"
      />

      <!-- Moderator Assignment Modal (admin only) -->
      <ModeratorAssignmentModal
        v-if="showModeratorColumn"
        v-model="showModeratorModal"
        :folder="moderatorTargetFolder"
        :all-users="allUsers || []"
        :loading="moderatorSaving"
        @save="handleSaveModerators"
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

.result-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border: none;
  border-radius: var(--radius-sm, 0.25rem);
  background: transparent;
  cursor: pointer;
  font-size: 0.75rem;
  flex-shrink: 0;
  transition: background 0.12s ease;
}

.result-action-btn:hover {
  background: #e5e7eb;
}
</style>
