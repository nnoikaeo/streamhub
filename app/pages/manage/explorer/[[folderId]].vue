<script setup lang="ts">
/**
 * Moderator Explorer Page
 *
 * Uses shared ExplorerPage component + useExplorer composable.
 * Shows full folder tree with non-assigned folders disabled.
 * CRUD scoped to manageable folders only.
 *
 * Route: /manage/explorer           → root
 * Route: /manage/explorer/:folderId → contents of a specific folder
 */

import ExplorerPage from '~/components/features/ExplorerPage.vue'
import { useModeratorFolders } from '~/composables/useModeratorFolders'
import { computeRecursiveDashboardCounts } from '~/composables/useAdminFolders'
import { useModeratorDashboards } from '~/composables/useModeratorDashboards'
import { useAdminTags } from '~/composables/useAdminTags'
import { useAdminUsers } from '~/composables/useAdminUsers'
import { useExplorer } from '~/composables/useExplorer'
import { useAuth } from '~/composables/useAuth'

definePageMeta({
  middleware: ['auth'],
  layout: 'default',
})

const router = useRouter()
const { user } = useAuth()

const {
  allFolders,
  allFolderTree,
  manageableFolders,
  manageableFolderIds,
  fetchFolders,
  createFolder,
  updateFolder,
  deleteFolder,
  canDeleteManagedFolder,
  canManageFolder,
  loading: foldersLoading,
} = useModeratorFolders()

const {
  manageableDashboards,
  fetchDashboards,
  createDashboard,
  updateDashboard,
  deleteDashboard,
  loading: dashboardsLoading,
} = useModeratorDashboards()

const { tags, fetchTags } = useAdminTags()
const { users, fetchUsers } = useAdminUsers()

// ─── Shared explorer logic ──────────────────────────────────────────────

const explorer = useExplorer({
  routePrefix: '/manage/explorer',
  allFolders,
  searchableFolders: manageableFolders,
  searchableDashboards: manageableDashboards,
  createFolder,
  updateFolder,
  deleteFolder,
  createDashboard,
  updateDashboard,
  deleteDashboard,
  canDeleteFolder: (folder) => {
    if (!canDeleteManagedFolder(folder.id)) {
      return 'คุณไม่มีสิทธิ์ลบโฟลเดอร์นี้ (สามารถลบได้เฉพาะโฟลเดอร์ย่อยที่คุณสร้างเอง)'
    }
    return true
  },
})

// ─── Moderator-specific computed ────────────────────────────────────────

const loading = computed(() => foldersLoading.value || dashboardsLoading.value)

const breadcrumbs = computed(() => [
  { label: 'จัดการ', to: '/manage/explorer' },
  { label: 'Explorer' },
])

/** Folders that moderator cannot manage — shown as disabled in tree */
const disabledFolderIds = computed(() => {
  const disabled = new Set<string>()
  for (const folder of allFolders.value) {
    if (!manageableFolderIds.value.has(folder.id)) {
      disabled.add(folder.id)
    }
  }
  return disabled
})

/** Whether moderator can create items in the current folder */
const canCreateInCurrentFolder = computed(() =>
  !!explorer.currentFolderId.value && canManageFolder(explorer.currentFolderId.value)
)

const currentSubfolders = computed(() =>
  allFolders.value.filter(f =>
    (f.parentId ?? null) === explorer.currentFolderId.value &&
    manageableFolderIds.value.has(f.id)
  )
)

const currentDashboards = computed(() =>
  manageableDashboards.value.filter(d => d.folderId === explorer.currentFolderId.value)
)

const dashboardCounts = computed(() =>
  computeRecursiveDashboardCounts(allFolders.value, manageableDashboards.value)
)

// ─── Navigation guard — redirect if URL points to non-manageable folder ──

watch([explorer.currentFolderId, allFolders], ([folderId, folders]) => {
  if (folderId && folders.length > 0 && !canManageFolder(folderId)) {
    router.push('/manage/explorer')
  }
})

// ─── Lifecycle ──────────────────────────────────────────────────────────

onMounted(async () => {
  // Wait for user to be loaded
  let attempts = 0
  while (!user?.value && attempts < 50) {
    await new Promise((resolve) => setTimeout(resolve, 100))
    attempts++
  }

  if (user.value?.role !== 'moderator') {
    router.push('/dashboard/discover')
    return
  }

  try {
    await Promise.all([fetchFolders(), fetchDashboards(), fetchTags(), fetchUsers()])
  } catch (error) {
    console.error('❌ Error loading manage explorer page:', error)
  }
})
</script>

<template>
  <ExplorerPage
    :explorer="explorer"
    :folder-tree="allFolderTree"
    :current-subfolders="currentSubfolders"
    :current-dashboards="currentDashboards"
    :loading="loading"
    :can-create-in-current-folder="canCreateInCurrentFolder"
    :breadcrumbs="breadcrumbs"
    :folder-form-folders="manageableFolders"
    :disabled-folder-ids="disabledFolderIds"
    :folders-loading="foldersLoading"
    :dashboards-loading="dashboardsLoading"
    :show-tag-selector="true"
    :can-create-tag="false"
    :available-tags="tags"
    :available-folders="manageableFolders"
    :all-users="users"
    :dashboard-counts="dashboardCounts"
  />
</template>
