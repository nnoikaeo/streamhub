<template>
  <PageLayout
    :folders="mockFolders"
    :allow-search="false"
    :allow-create="false"
    :breadcrumbs="breadcrumbs"
  >
    <!-- Main Content: Permissions Editor -->
    <div class="permissions-page">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Permission Management</h1>
          <p class="page-subtitle">Configure dashboard access with 3-layer permission model</p>
        </div>

        <div class="header-actions">
          <button
            type="button"
            class="action-button secondary"
            @click="resetEditor"
            :disabled="!hasChanges"
            title="Reset changes"
          >
            Reset
          </button>
          <button
            type="button"
            class="action-button primary"
            @click="savePermissions"
            :disabled="!hasChanges || isSaving"
            title="Save changes"
          >
            <span v-if="isSaving" class="button-spinner" />
            {{ isSaving ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>

      <!-- Status Messages -->
      <div v-if="successMessage" class="alert alert-success" role="status">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <span>{{ successMessage }}</span>
        <button type="button" class="alert-close" @click="successMessage = null" aria-label="Dismiss">
          ✕
        </button>
      </div>

      <div v-if="errorMessage" class="alert alert-error" role="alert">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span>{{ errorMessage }}</span>
        <button type="button" class="alert-close" @click="errorMessage = null" aria-label="Dismiss">
          ✕
        </button>
      </div>

      <!-- Dashboard Selector -->
      <div class="section">
        <h2 class="section-title">Select Dashboard</h2>
        <div class="section-content">
          <div class="form-group">
            <label for="dashboard-select" class="form-label">Dashboard</label>
            <select
              id="dashboard-select"
              v-model="selectedDashboardId"
              class="form-input form-select"
              @change="loadDashboardPermissions"
              :disabled="isLoading"
            >
              <option value="">Choose a dashboard...</option>
              <option v-for="dash in dashboards" :key="dash.id" :value="dash.id">
                {{ dash.name }} ({{ dash.type }})
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Permissions Editor -->
      <div v-if="selectedDashboardId && currentDashboard" class="section">
        <h2 class="section-title">Dashboard: {{ currentDashboard.name }}</h2>
        <p class="section-subtitle">
          Located in: <strong>{{ currentDashboardFolder }}</strong>
        </p>

        <!-- Loading State -->
        <div v-if="isLoading" class="loading-state">
          <div class="loading-spinner" />
          <p>Loading permissions...</p>
        </div>

        <!-- Permission Editor Component -->
        <div v-else class="section-content">
          <PermissionEditor
            :dashboard="currentDashboard"
            :all-users="allUsers"
            :current-permissions="permissionsToEdit"
            @update:permissions="handlePermissionsUpdate"
          />
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="!isLoading" class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="9" y1="3" x2="9" y2="21" />
        </svg>
        <h3>Select a Dashboard</h3>
        <p>Choose a dashboard to manage its permissions</p>
      </div>
    </div>
  </PageLayout>
</template>

<script setup lang="ts">
import PageLayout from '~/components/compositions/PageLayout.vue'
import { useAdminBreadcrumbs } from '~/composables/useAdminBreadcrumbs'
import { mockFolders } from '~/composables/useMockData'
import { computed, ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '~/composables/useAuth'
import { useDashboardService } from '~/composables/useDashboardService'
import type { Dashboard, User, AccessControl, AccessRestrictions, Folder } from '~/types/dashboard'
import PermissionEditor from '~/components/features/PermissionEditor.vue'

const { breadcrumbs } = useAdminBreadcrumbs()

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
    await loadDashboards()
  }
})

// State
const dashboards = ref<Dashboard[]>([])
const allUsers = ref<User[]>([])
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
  access: { public: false, directAccess: { users: [], roles: [], groups: [] }, companyScoped: { roles: [], groups: [] } },
  restrictions: { revokedUsers: [], expiryDate: null },
})
const originalPermissions = ref<{
  access: AccessControl
  restrictions: AccessRestrictions
}>({
  access: { public: false, directAccess: { users: [], roles: [], groups: [] }, companyScoped: { roles: [], groups: [] } },
  restrictions: { revokedUsers: [], expiryDate: null },
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

    // Load all users
    // Note: This would need a service method to get all users
    // For now using mock data
    const { mockUsers } = await import('~/composables/useMockData')
    allUsers.value = mockUsers

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
      comment: 'Updated via admin panel',
    })

    if (response.success) {
      successMessage.value = `Permissions saved for "${currentDashboard.value.name}"`
      originalPermissions.value = JSON.parse(JSON.stringify(permissionsToEdit.value))

      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        successMessage.value = null
      }, 5000)
    } else {
      errorMessage.value = response.error || 'Failed to save permissions'
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

// Lifecycle - Auth check is in the script above

</script>

<style scoped>
.permissions-page {
  padding: 2rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
  margin-bottom: 2rem;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
  line-height: 1.2;
}

.page-subtitle {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin: 0.5rem 0 0 0;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.2s;
}

.action-button.primary {
  background: var(--color-primary);
  color: white;
}

.action-button.primary:hover:not(:disabled) {
  opacity: 0.9;
}

.action-button.secondary {
  background: white;
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.action-button.secondary:hover:not(:disabled) {
  background: var(--color-bg-light);
  border-color: var(--color-text-secondary);
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.button-spinner {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.alert {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 0.375rem;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
}

.alert svg {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
}

.alert-success {
  background: var(--color-bg-success);
  border: 1px solid var(--color-border-success);
  color: var(--color-success);
}

.alert-error {
  background: var(--color-bg-error);
  border: 1px solid var(--color-border-error);
  color: var(--color-error);
}

.alert-close {
  margin-left: auto;
  background: none;
  border: none;
  cursor: pointer;
  color: inherit;
  padding: 0 0.25rem;
  font-size: 1.125rem;
  line-height: 1;
}

.alert-close:hover {
  opacity: 0.7;
}

.section {
  background: white;
  border: 1px solid var(--color-border-light);
  border-radius: 0.5rem;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 0.5rem 0;
}

.section-subtitle {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin: 0 0 1.5rem 0;
}

.section-content {
  margin-top: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 0.5rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background: white;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(45, 51, 137, 0.1);
}

.form-input:disabled {
  background: var(--color-bg-light);
  color: var(--color-gray-400);
  cursor: not-allowed;
}

.form-select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%236b7280'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clip-rule='evenodd'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 1.25rem 1.25rem;
  padding-right: 2.5rem;
}

.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding: 3rem;
  flex-direction: column;
}

.loading-spinner {
  width: 2.5rem;
  height: 2.5rem;
  border: 3px solid var(--color-border-light);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 4rem 2rem;
  text-align: center;
}

.empty-state svg {
  width: 4rem;
  height: 4rem;
  color: var(--color-border);
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

/* Admin Navigation */
.admin-nav {
  padding: 1rem 0;
}

.nav-section {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--color-border-light);
}

.nav-section:last-child {
  border-bottom: none;
}

.nav-section-title {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--color-gray-400);
  margin: 0 0 0.75rem 0;
  letter-spacing: 0.05em;
}

.nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-list li {
  margin-bottom: 0.5rem;
}

.nav-list li:last-child {
  margin-bottom: 0;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: 0.875rem;
  border-radius: 0.375rem;
  transition: all 0.2s;
}

.nav-link:hover {
  background: var(--color-bg-light);
  color: var(--color-text-primary);
}

.nav-link.active {
  background: var(--color-bg-info);
  color: var(--color-info);
  font-weight: 600;
}

.nav-link svg {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .permissions-page {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
  }

  .header-actions {
    width: 100%;
    flex-direction: column;
  }

  .action-button {
    width: 100%;
    justify-content: center;
  }
}
</style>
