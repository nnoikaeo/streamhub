<script setup lang="ts">
/**
 * Admin Explorer Page
 *
 * Uses shared ExplorerPage component + useExplorer composable.
 * Admin sees all folders and dashboards with full CRUD access.
 *
 * Route: /admin/explorer           → root
 * Route: /admin/explorer/:folderId → contents of a specific folder
 */

import ExplorerPage from '~/components/features/ExplorerPage.vue'
import { useAdminFolders } from '~/composables/useAdminFolders'
import { useAdminDashboards } from '~/composables/useAdminDashboards'
import { useAdminUsers } from '~/composables/useAdminUsers'
import { useAdminBreadcrumbs } from '~/composables/useAdminBreadcrumbs'
import { useExplorer } from '~/composables/useExplorer'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  middleware: ['auth', 'admin'],
  layout: 'default',
})

const authStore = useAuthStore()
const { breadcrumbs } = useAdminBreadcrumbs()
const { users, fetchUsers } = useAdminUsers()

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

// ─── Shared explorer logic ──────────────────────────────────────────────

const explorer = useExplorer({
  routePrefix: '/admin/explorer',
  allFolders: folders,
  searchableFolders: folders,
  searchableDashboards: dashboards,
  createFolder,
  updateFolder,
  deleteFolder,
  createDashboard,
  updateDashboard,
  deleteDashboard,
})

// ─── Admin-specific computed ────────────────────────────────────────────

const isAdmin = computed(() => authStore.user?.role === 'admin')
const loading = computed(() => foldersLoading.value || dashboardsLoading.value)
const folderTree = computed(() => buildFolderTree(folders.value))

const currentSubfolders = computed(() =>
  folders.value.filter(f => (f.parentId ?? null) === explorer.currentFolderId.value)
)

const currentDashboards = computed(() =>
  dashboards.value.filter(d => d.folderId === explorer.currentFolderId.value)
)

// ─── Moderator assignment handler ───────────────────────────────────────

const handleSaveModerators = async (folderId: string, moderatorUids: string[]) => {
  await updateFolder(folderId, { assignedModerators: moderatorUids })
}

// ─── Lifecycle ──────────────────────────────────────────────────────────

onMounted(async () => {
  await Promise.all([fetchFolders(), fetchDashboards(), fetchUsers()])
})
</script>

<template>
  <ExplorerPage
    :explorer="explorer"
    :folder-tree="folderTree"
    :current-subfolders="currentSubfolders"
    :current-dashboards="currentDashboards"
    :loading="loading"
    :can-create-in-current-folder="isAdmin"
    :breadcrumbs="breadcrumbs"
    :folder-form-folders="folders"
    :folders-loading="foldersLoading"
    :dashboards-loading="dashboardsLoading"
    :show-moderator-column="true"
    :all-users="users"
    :on-save-moderators="handleSaveModerators"
  />
</template>
