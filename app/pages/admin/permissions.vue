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
            <!-- Selected indicator (shown when a dashboard is selected and input is not focused) -->
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
              :all-users="allUsersFromComposable"
              :all-groups="groups"
              :all-companies="companies"
              :current-permissions="permissionsToEdit"
              :show-restrictions="true"
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

<script setup lang="ts">
import PageLayout from '~/components/compositions/PageLayout.vue'
import AdminPageContent from '~/components/admin/AdminPageContent.vue'
import { useAdminBreadcrumbs } from '~/composables/useAdminBreadcrumbs'
import { useAdminFolders } from '~/composables/useAdminFolders'
import { useAdminUsers } from '~/composables/useAdminUsers'
import { useAdminCompanies } from '~/composables/useAdminCompanies'
import { useAdminGroups } from '~/composables/useAdminGroups'
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '~/composables/useAuth'
import { useDashboardService } from '~/composables/useDashboardService'
import type { Dashboard, User, AccessControl, AccessRestrictions, Folder } from '~/types/dashboard'
import PermissionEditor from '~/components/features/PermissionEditor.vue'

const { breadcrumbs } = useAdminBreadcrumbs()
const { folders, fetchFolders, getFolderPath } = useAdminFolders()
const { users: allUsersFromComposable, fetchUsers } = useAdminUsers()
const { companies, fetchCompanies } = useAdminCompanies()
const { groups, fetchGroups } = useAdminGroups()

// Page metadata
definePageMeta({
  middleware: ['auth', 'admin'],
  layout: 'default',
})

// Router and Auth
const router = useRouter()
const route = useRoute()
const { user, loading } = useAuth()
const dashboardService = useDashboardService()

// Check admin role
onMounted(async () => {
  console.log(`🔐 [permissions.vue] onMounted - Checking admin access`)
  
  // Wait for user to be loaded (max 5 seconds)
  console.log(`🔐 [permissions.vue] Waiting for auth to load...`)
  let attempts = 0
  while (!user?.value && attempts < 50) {
    await new Promise((resolve) => setTimeout(resolve, 100))
    attempts++
  }
  
  console.log(`🔐 [permissions.vue] Auth wait completed after ${attempts * 100}ms`)
  console.log(`🔐 [permissions.vue] user.value:`, user.value)
  console.log(`🔐 [permissions.vue] user.value?.role:`, user.value?.role)
  
  if (user.value?.role !== 'admin') {
    console.log(`❌ [permissions.vue] Not admin (role: ${user.value?.role}), redirecting to /dashboard/discover`)
    router.push('/dashboard/discover')
  } else {
    console.log(`✅ [permissions.vue] Admin access granted`)
    // Continue with dashboard loading
    await Promise.all([loadDashboards(), fetchFolders(), fetchCompanies(), fetchGroups()])
  }
})

// State
const dashboards = ref<Dashboard[]>([])
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

// Dashboard search dropdown
const dashboardSearchQuery = ref('')
const isDropdownOpen = ref(false)
const searchInputRef = ref<HTMLInputElement | null>(null)

const sortedDashboards = computed(() => {
  return [...dashboards.value].sort((a, b) => {
    const pathA = getFolderBreadcrumb(a.folderId)
    const pathB = getFolderBreadcrumb(b.folderId)
    return pathA.localeCompare(pathB) || a.name.localeCompare(b.name)
  })
})

const filteredDashboards = computed(() => {
  if (!dashboardSearchQuery.value) return sortedDashboards.value
  const q = dashboardSearchQuery.value.toLowerCase()
  return sortedDashboards.value.filter(d =>
    d.name.toLowerCase().includes(q) || getFolderBreadcrumb(d.folderId).toLowerCase().includes(q)
  )
})

const getFolderBreadcrumb = (folderId: string): string => {
  const path = getFolderPath(folderId)
  return path.map(f => f.name).join(' > ') || ''
}

const selectDashboard = (dashboardId: string) => {
  selectedDashboardId.value = dashboardId
  dashboardSearchQuery.value = ''
  isDropdownOpen.value = false
  loadDashboardPermissions()
}

const clearSelection = () => {
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

// Computed properties
const hasChanges = computed(() => {
  return JSON.stringify(permissionsToEdit.value) !== JSON.stringify(originalPermissions.value)
})

// Load dashboards
const loadDashboards = async () => {
  try {
    isLoading.value = true
    errorMessage.value = null

    if (!user.value) {
      errorMessage.value = 'User not authenticated'
      return
    }

    // Get all dashboards for admin
    const response = await dashboardService.getDashboards(user.value.uid, user.value.company, {
      limit: 100,
    })

    dashboards.value = response.dashboards

    // Load all users from composable
    await fetchUsers()

    // Check if dashboard is specified in query params
    if (route.query.dashboard) {
      selectedDashboardId.value = route.query.dashboard as string
      await loadDashboardPermissions()
    }
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Failed to load dashboards'
    console.error('Error loading dashboards:', err)
  } finally {
    isLoading.value = false
  }
}

// Load permissions for selected dashboard
const loadDashboardPermissions = async () => {
  try {
    if (!selectedDashboardId.value) {
      currentDashboard.value = null
      return
    }

    isLoading.value = true
    errorMessage.value = null

    // Load dashboard
    const dashboard = await dashboardService.getDashboard(selectedDashboardId.value)
    if (!dashboard) {
      errorMessage.value = 'Dashboard not found'
      return
    }

    currentDashboard.value = dashboard

    // Load folder info
    const folder = await dashboardService.getFolder(dashboard.folderId)
    if (folder) {
      currentDashboardFolder.value = folder.name
    }

    // Load current permissions
    const perms = await dashboardService.getDashboardPermissions(selectedDashboardId.value)

    permissionsToEdit.value = {
      access: perms.access,
      restrictions: perms.restrictions,
    }

    originalPermissions.value = JSON.parse(JSON.stringify(permissionsToEdit.value))
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Failed to load permissions'
    console.error('Error loading permissions:', err)
  } finally {
    isLoading.value = false
  }
}

// Handle permissions update from editor
const handlePermissionsUpdate = (newPermissions: { access: AccessControl; restrictions: AccessRestrictions }) => {
  permissionsToEdit.value = newPermissions
}

// Save permissions
const savePermissions = async () => {
  try {
    if (!selectedDashboardId.value || !currentDashboard.value) {
      errorMessage.value = 'No dashboard selected'
      return
    }

    isSaving.value = true
    errorMessage.value = null

    // Save permissions
    const response = await dashboardService.saveDashboardPermissions({
      dashboardId: selectedDashboardId.value,
      access: permissionsToEdit.value.access,
      restrictions: permissionsToEdit.value.restrictions,
      updatedBy: user.value?.uid ?? '',
    })

    if (response.success) {
      successMessage.value = `Permissions saved for "${currentDashboard.value.name}"`
      originalPermissions.value = JSON.parse(JSON.stringify(permissionsToEdit.value))

      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        successMessage.value = null
      }, 5000)
    } else {
      errorMessage.value = response.message || 'Failed to save permissions'
    }
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Failed to save permissions'
    console.error('Error saving permissions:', err)
  } finally {
    isSaving.value = false
  }
}

// Reset changes
const resetEditor = () => {
  permissionsToEdit.value = JSON.parse(JSON.stringify(originalPermissions.value))
}

/**
 * Build folder tree hierarchy with children from flat folders array
 * Converts flat folders to tree structure for FolderTree component
 */
const buildFolderTree = (flatFolders: Folder[]): Folder[] => {
  const folderMap = new Map<string, Folder & { children: Folder[] }>()

  // First pass: create enhanced folder objects with empty children arrays
  for (const folder of flatFolders) {
    folderMap.set(folder.id, {
      ...folder,
      children: []
    })
  }

  // Second pass: build parent-child relationships
  const rootFolders: (Folder & { children: Folder[] })[] = []
  for (const folder of flatFolders) {
    const enhancedFolder = folderMap.get(folder.id)!
    if (folder.parentId) {
      // This folder has a parent
      const parentFolder = folderMap.get(folder.parentId)
      if (parentFolder) {
        parentFolder.children.push(enhancedFolder)
      }
    } else {
      // Root folder (no parent)
      rootFolders.push(enhancedFolder)
    }
  }

  return rootFolders
}

/**
 * Folder tree with hierarchy built from flat folders array
 */
const folderTree = computed(() => buildFolderTree(folders.value))

// Lifecycle - Auth check is in the script above

</script>

<style scoped>
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
