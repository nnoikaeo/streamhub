<script setup lang="ts">
/**
 * PermissionsPage — Shared Permissions Management Component
 *
 * Used by both admin (/admin/permissions) and moderator (/manage/permissions).
 * Provides searchable dashboard dropdown, PermissionEditor integration,
 * save/reset actions, alerts, and loading/empty states.
 *
 * Role differences controlled via props:
 * - dashboards: all (admin) vs manageable only (moderator)
 * - showRestrictions: true (admin) vs false (moderator)
 * - folderTree: full tree (admin) vs assigned tree (moderator)
 */

import PageLayout from '~/components/compositions/PageLayout.vue'
import PermissionEditor from '~/components/features/PermissionEditor.vue'
import { useDashboardService } from '~/composables/useDashboardService'
import { useAuth } from '~/composables/useAuth'
import type { Dashboard, User, AccessControl, AccessRestrictions, Folder } from '~/types/dashboard'

interface Props {
  /** Dashboards available for selection */
  dashboards: Dashboard[]

  /** All users for PermissionEditor */
  allUsers: User[]

  /** All groups for PermissionEditor */
  allGroups: any[]

  /** All companies for PermissionEditor */
  allCompanies: any[]

  /** Whether to show restrictions tab (admin=true, moderator=false) */
  showRestrictions: boolean

  /** Folder tree for PageLayout sidebar */
  folderTree: Folder[]

  /** All folders (flat) for building breadcrumb paths */
  allFolders: Folder[]

  /** PageLayout breadcrumbs */
  breadcrumbs: { label: string; to?: string }[]

  /** Function to get folder path from folderId */
  getFolderPath?: (folderId: string) => Folder[]

  /** Optional permission validation before loading */
  canManageFolder?: (folderId: string) => boolean
}

const props = defineProps<Props>()
const route = useRoute()
const router = useRouter()
const { user } = useAuth()
const dashboardService = useDashboardService()

/** Whether we arrived from explorer via ?dashboard or ?folder query param */
const cameFromExplorer = computed(() => !!route.query.dashboard || !!route.query.folder)

const goBackToExplorer = () => {
  // Navigate back — browser history has the explorer page
  router.back()
}

// ─── State ──────────────────────────────────────────────────────────────

const selectedDashboardId = ref<string>('')
const currentDashboard = ref<Dashboard | null>(null)
const currentDashboardFolder = ref<string>('')
const isLoading = ref(false)
const isSaving = ref(false)
const errorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)

const permissionsToEdit = ref<{
  access: AccessControl
  restrictions: AccessRestrictions
}>({
  access: { direct: { users: [], roles: [], groups: [] }, company: {} },
  restrictions: { revoke: [], expiry: {} },
})

const originalPermissions = ref<{
  access: AccessControl
  restrictions: AccessRestrictions
}>({
  access: { direct: { users: [], roles: [], groups: [] }, company: {} },
  restrictions: { revoke: [], expiry: {} },
})

// ─── Dashboard search dropdown ──────────────────────────────────────────

const dashboardSearchQuery = ref('')
const isDropdownOpen = ref(false)
const searchInputRef = ref<HTMLInputElement | null>(null)

const getFolderBreadcrumb = (folderId: string): string => {
  if (props.getFolderPath) {
    const path = props.getFolderPath(folderId)
    return path.map(f => f.name).join(' > ') || ''
  }
  // Fallback: build path from allFolders
  const parts: string[] = []
  let id: string | null | undefined = folderId
  while (id) {
    const folder = props.allFolders.find(f => f.id === id)
    if (!folder) break
    parts.unshift(folder.name)
    id = folder.parentId ?? null
  }
  return parts.join(' > ') || ''
}

const sortedDashboards = computed(() => {
  return [...props.dashboards].sort((a, b) => {
    const pathA = getFolderBreadcrumb(a.folderId)
    const pathB = getFolderBreadcrumb(b.folderId)
    return pathA.localeCompare(pathB) || a.name.localeCompare(b.name)
  })
})

/** Pre-filter folder from query param */
const preFilterFolderId = computed(() => route.query.folder as string | undefined)

/** Get all descendant folder IDs (including the folder itself) */
const getDescendantFolderIds = (folderId: string): Set<string> => {
  const ids = new Set<string>([folderId])
  const collectChildren = (parentId: string) => {
    for (const folder of props.allFolders) {
      if (folder.parentId === parentId && !ids.has(folder.id)) {
        ids.add(folder.id)
        collectChildren(folder.id)
      }
    }
  }
  collectChildren(folderId)
  return ids
}

const filteredDashboards = computed(() => {
  let list = sortedDashboards.value

  // Pre-filter by folder (including subfolders) when navigated from explorer with ?folder=id
  if (preFilterFolderId.value) {
    const folderIds = getDescendantFolderIds(preFilterFolderId.value)
    list = list.filter(d => folderIds.has(d.folderId))
  }

  if (!dashboardSearchQuery.value) return list
  const q = dashboardSearchQuery.value.toLowerCase()
  return list.filter(d =>
    d.name.toLowerCase().includes(q) || getFolderBreadcrumb(d.folderId).toLowerCase().includes(q)
  )
})

const selectDashboard = (dashboardId: string) => {
  selectedDashboardId.value = dashboardId
  dashboardSearchQuery.value = ''
  isDropdownOpen.value = false
  loadDashboardPermissions()
}

const clearSelection = () => {
  if (cameFromExplorer.value) {
    goBackToExplorer()
    return
  }
  selectedDashboardId.value = ''
  currentDashboard.value = null
  currentDashboardFolder.value = ''
  dashboardSearchQuery.value = ''
}

const focusSearch = () => {
  searchInputRef.value?.focus()
}

// Close dropdown on click outside
const handleClickOutside = (e: MouseEvent) => {
  const wrapper = (e.target as HTMLElement)?.closest('.dashboard-search-wrapper')
  if (!wrapper) isDropdownOpen.value = false
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// ─── Computed ───────────────────────────────────────────────────────────

const hasChanges = computed(() => {
  return JSON.stringify(permissionsToEdit.value) !== JSON.stringify(originalPermissions.value)
})

// ─── Load permissions ───────────────────────────────────────────────────

const loadDashboardPermissions = async () => {
  try {
    if (!selectedDashboardId.value) {
      currentDashboard.value = null
      return
    }

    isLoading.value = true
    errorMessage.value = null

    const dashboard = await dashboardService.getDashboard(selectedDashboardId.value)
    if (!dashboard) {
      errorMessage.value = 'ไม่พบแดชบอร์ด'
      return
    }

    // Verify permission if canManageFolder is provided
    if (props.canManageFolder && !props.canManageFolder(dashboard.folderId)) {
      errorMessage.value = 'ไม่มีสิทธิ์จัดการแดชบอร์ดนี้'
      return
    }

    currentDashboard.value = dashboard

    const folder = await dashboardService.getFolder(dashboard.folderId)
    if (folder) {
      currentDashboardFolder.value = folder.name
    }

    const perms = await dashboardService.getDashboardPermissions(selectedDashboardId.value)
    permissionsToEdit.value = {
      access: perms.access,
      restrictions: perms.restrictions,
    }
    originalPermissions.value = JSON.parse(JSON.stringify(permissionsToEdit.value))
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'ไม่สามารถโหลดสิทธิ์ได้'
    console.error('Error loading permissions:', err)
  } finally {
    isLoading.value = false
  }
}

// ─── Handle permissions update ──────────────────────────────────────────

const handlePermissionsUpdate = (newPermissions: { access: AccessControl; restrictions: AccessRestrictions }) => {
  permissionsToEdit.value = newPermissions
}

// ─── Save permissions ───────────────────────────────────────────────────

const savePermissions = async () => {
  try {
    if (!selectedDashboardId.value || !currentDashboard.value) {
      errorMessage.value = 'ยังไม่ได้เลือกแดชบอร์ด'
      return
    }

    isSaving.value = true
    errorMessage.value = null

    const response = await dashboardService.saveDashboardPermissions({
      dashboardId: selectedDashboardId.value,
      access: permissionsToEdit.value.access,
      restrictions: permissionsToEdit.value.restrictions,
      updatedBy: user.value?.uid ?? '',
    })

    if (response.success) {
      if (cameFromExplorer.value) {
        goBackToExplorer()
        return
      }
      successMessage.value = `บันทึกสิทธิ์สำหรับ "${currentDashboard.value.name}" แล้ว`
      originalPermissions.value = JSON.parse(JSON.stringify(permissionsToEdit.value))
      setTimeout(() => { successMessage.value = null }, 5000)
    } else {
      errorMessage.value = response.message || 'ไม่สามารถบันทึกสิทธิ์ได้'
    }
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'ไม่สามารถบันทึกสิทธิ์ได้'
    console.error('Error saving permissions:', err)
  } finally {
    isSaving.value = false
  }
}

// ─── Reset ──────────────────────────────────────────────────────────────

const resetEditor = () => {
  permissionsToEdit.value = JSON.parse(JSON.stringify(originalPermissions.value))
}

// Auto-select dashboard from query param (?dashboard=xxx)
const queryDashboardHandled = ref(false)
watch(() => props.dashboards, (dashboards) => {
  const queryId = route.query.dashboard as string
  if (queryId && dashboards.length > 0 && !queryDashboardHandled.value) {
    const exists = dashboards.some(d => d.id === queryId)
    if (exists) {
      queryDashboardHandled.value = true
      selectDashboard(queryId)
    }
  }
}, { immediate: true })
</script>

<template>
  <PageLayout
    :folders="folderTree"
    :allow-search="false"
    :allow-create="false"
    :breadcrumbs="breadcrumbs"
  >
    <AdminPageContent>
      <template #header>
        <h1 class="page-header__title">จัดการสิทธิ์</h1>
      </template>

      <template #filters>
        <!-- Folder pre-filter indicator -->
        <div v-if="preFilterFolderId" class="folder-filter-indicator">
          <span class="folder-filter-label">📁 แสดง dashboard ใน: <strong>{{ getFolderBreadcrumb(preFilterFolderId) }}</strong></span>
          <button
            type="button"
            class="folder-filter-clear"
            @click="router.replace({ query: { ...route.query, folder: undefined } })"
            title="แสดงทั้งหมด"
          >✕ แสดงทั้งหมด</button>
        </div>
        <div class="filter-group dashboard-search-wrapper">
          <div class="dashboard-search" :class="{ 'dashboard-search--open': isDropdownOpen }">
            <input
              ref="searchInputRef"
              v-model="dashboardSearchQuery"
              type="text"
              class="theme-form-input"
              :placeholder="selectedDashboardId ? '' : '🔍 ค้นหาแดชบอร์ด...'"
              :disabled="isLoading"
              @focus="isDropdownOpen = true"
              @input="isDropdownOpen = true"
            />
            <!-- Selected indicator -->
            <div
              v-if="selectedDashboardId && !dashboardSearchQuery"
              class="dashboard-search__selected"
              @click="focusSearch"
            >
              <span class="dashboard-search__name">{{ currentDashboard?.name }}</span>
              <span class="dashboard-search__folder">{{ currentDashboardFolder }}</span>
              <button
                type="button"
                class="dashboard-search__clear"
                @click.stop="clearSelection"
                title="ล้างการเลือก"
              >✕</button>
            </div>

            <!-- Dropdown list -->
            <div v-if="isDropdownOpen" class="dashboard-dropdown">
              <div
                v-for="dash in filteredDashboards"
                :key="dash.id"
                class="dashboard-dropdown__item"
                :class="{ 'dashboard-dropdown__item--active': dash.id === selectedDashboardId }"
                @mousedown.prevent="selectDashboard(dash.id)"
              >
                <span class="dashboard-dropdown__name">{{ dash.name }}</span>
                <span class="dashboard-dropdown__folder">{{ getFolderBreadcrumb(dash.folderId) }}</span>
              </div>
              <div v-if="filteredDashboards.length === 0" class="dashboard-dropdown__empty">
                ไม่พบแดชบอร์ด
              </div>
            </div>
          </div>
        </div>
      </template>

      <template #table>
        <!-- Status Messages -->
        <div v-if="successMessage" class="alert alert-success" role="status">
          <span>{{ successMessage }}</span>
          <button type="button" class="alert-close" @click="successMessage = null" aria-label="Dismiss">✕</button>
        </div>

        <div v-if="errorMessage" class="alert alert-error" role="alert">
          <span>{{ errorMessage }}</span>
          <button type="button" class="alert-close" @click="errorMessage = null" aria-label="Dismiss">✕</button>
        </div>

        <!-- Permissions Editor -->
        <div v-if="selectedDashboardId && currentDashboard" class="editor-section">
          <div class="editor-header">
            <div>
              <h2 class="editor-title">{{ currentDashboard.name }}</h2>
              <p class="editor-subtitle">โฟลเดอร์: {{ currentDashboardFolder }}</p>
            </div>
            <div class="editor-actions">
              <button
                type="button"
                class="page-header-action-btn page-header-action-btn--secondary"
                @click="resetEditor"
                :disabled="!hasChanges"
              >
                รีเซ็ต
              </button>
              <button
                type="button"
                class="page-header-action-btn"
                @click="savePermissions"
                :disabled="!hasChanges || isSaving"
              >
                {{ isSaving ? 'กำลังบันทึก...' : 'บันทึก' }}
              </button>
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="isLoading" class="loading-state">
            <div class="loading-spinner" />
            <p>กำลังโหลด...</p>
          </div>

          <!-- Permission Editor Component -->
          <div v-else>
            <PermissionEditor
              :dashboard-id="selectedDashboardId"
              :all-users="allUsers"
              :all-groups="allGroups"
              :all-companies="allCompanies"
              :current-permissions="permissionsToEdit"
              :show-restrictions="showRestrictions"
              @update:permissions="handlePermissionsUpdate"
            />
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="!isLoading" class="empty-state">
          <div class="empty-state__icon">🔐</div>
          <h3>เลือกแดชบอร์ด</h3>
          <p>เลือกแดชบอร์ดจากด้านบนเพื่อจัดการสิทธิ์</p>
        </div>
      </template>
    </AdminPageContent>
  </PageLayout>
</template>

<style scoped>
/* Folder pre-filter indicator */
.folder-filter-indicator {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  color: #1e40af;
}

.folder-filter-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.folder-filter-clear {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.8rem;
  color: #1e40af;
  white-space: nowrap;
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  transition: background 0.12s ease;
}

.folder-filter-clear:hover {
  background: #dbeafe;
}

/* Dashboard Search Dropdown */
.dashboard-search-wrapper {
  position: relative;
}

.dashboard-search {
  position: relative;
}

.dashboard-search__selected {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 0 2.5rem 0 var(--spacing-md);
  cursor: pointer;
  background: white;
  border-radius: var(--radius-md);
}

.dashboard-search__name {
  font-weight: 600;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dashboard-search__folder {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.dashboard-search__clear {
  position: absolute;
  right: var(--spacing-sm);
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  padding: 0.25rem;
  line-height: 1;
}

.dashboard-search__clear:hover {
  color: var(--color-text-primary);
}

.dashboard-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 50;
  max-height: 320px;
  overflow-y: auto;
  background: white;
  border: 1px solid var(--color-border-default, #d1d5db);
  border-top: none;
  border-radius: 0 0 var(--radius-md) var(--radius-md);
  box-shadow: var(--shadow-lg, 0 10px 15px -3px rgba(0,0,0,.1));
}

.dashboard-dropdown__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  cursor: pointer;
  transition: background-color 0.15s;
}

.dashboard-dropdown__item:hover {
  background-color: var(--color-bg-secondary, #f3f4f6);
}

.dashboard-dropdown__item--active {
  background-color: var(--color-primary-light, #e0e7ff);
  font-weight: 600;
}

.dashboard-dropdown__name {
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dashboard-dropdown__folder {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  white-space: nowrap;
  flex-shrink: 0;
}

.dashboard-dropdown__empty {
  padding: var(--spacing-lg);
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}

/* Editor Section */
.editor-section {
  padding: var(--spacing-lg);
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
  gap: var(--spacing-md);
}

.editor-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.editor-subtitle {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin: 0.25rem 0 0 0;
}

.editor-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.page-header-action-btn--secondary {
  background: white !important;
  color: var(--color-text-primary) !important;
  border: 1px solid var(--color-border-default) !important;
}

.page-header-action-btn--secondary:hover:not(:disabled) {
  background: var(--color-bg-secondary) !important;
}

/* Alerts */
.alert {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  margin: var(--spacing-md);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
}

.alert-success {
  background: var(--color-bg-success, #f0fdf4);
  border: 1px solid var(--color-border-success, #bbf7d0);
  color: var(--color-success, #16a34a);
}

.alert-error {
  background: var(--color-bg-error, #fef2f2);
  border: 1px solid var(--color-border-error, #fecaca);
  color: var(--color-error, #dc2626);
}

.alert-close {
  margin-left: auto;
  background: none;
  border: none;
  cursor: pointer;
  color: inherit;
  font-size: 1rem;
}

/* Loading */
.loading-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: var(--spacing-md);
  padding: 3rem;
}

.loading-spinner {
  width: 2.5rem;
  height: 2.5rem;
  border: 3px solid var(--color-border-light, #e5e7eb);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: 4rem 2rem;
  text-align: center;
}

.empty-state__icon {
  font-size: 3rem;
}

.empty-state h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.empty-state p {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .editor-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .editor-actions {
    width: 100%;
  }
}
</style>
