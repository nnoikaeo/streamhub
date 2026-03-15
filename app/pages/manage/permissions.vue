<template>
  <PageLayout
    :folders="assignedFolderTree"
    :allow-search="false"
    :allow-create="false"
    :breadcrumbs="breadcrumbs"
  >
    <!-- Main Content: Permissions Editor -->
    <div class="permissions-page">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">จัดการสิทธิ์</h1>
          <p class="page-subtitle">กำหนดสิทธิ์การเข้าถึงแดชบอร์ดในโฟลเดอร์ที่ดูแล</p>
        </div>

        <div class="header-actions">
          <button
            type="button"
            class="action-button secondary"
            @click="resetEditor"
            :disabled="!hasChanges"
            title="รีเซ็ตการเปลี่ยนแปลง"
          >
            รีเซ็ต
          </button>
          <button
            type="button"
            class="action-button primary"
            @click="savePermissions"
            :disabled="!hasChanges || isSaving"
            title="บันทึกการเปลี่ยนแปลง"
          >
            <span v-if="isSaving" class="button-spinner" />
            {{ isSaving ? 'กำลังบันทึก...' : 'บันทึก' }}
          </button>
        </div>
      </div>

      <!-- Status Messages -->
      <div v-if="successMessage" class="alert alert-success" role="status">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <span>{{ successMessage }}</span>
        <button type="button" class="alert-close" @click="successMessage = null" aria-label="ปิด">
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
        <button type="button" class="alert-close" @click="errorMessage = null" aria-label="ปิด">
          ✕
        </button>
      </div>

      <!-- Dashboard Selector -->
      <div class="section">
        <h2 class="section-title">เลือกแดชบอร์ด</h2>
        <div class="section-content">
          <div class="form-group">
            <label for="dashboard-select" class="form-label">แดชบอร์ด</label>
            <select
              id="dashboard-select"
              v-model="selectedDashboardId"
              class="form-input form-select"
              @change="loadDashboardPermissions"
              :disabled="isLoading"
            >
              <option value="">เลือกแดชบอร์ด...</option>
              <option v-for="dash in manageableDashboards" :key="dash.id" :value="dash.id">
                {{ dash.name }} ({{ dash.type }})
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Permissions Editor -->
      <div v-if="selectedDashboardId && currentDashboard" class="section">
        <h2 class="section-title">แดชบอร์ด: {{ currentDashboard.name }}</h2>
        <p class="section-subtitle">
          โฟลเดอร์: <strong>{{ currentDashboardFolder }}</strong>
        </p>

        <!-- Loading State -->
        <div v-if="isLoading" class="loading-state">
          <div class="loading-spinner" />
          <p>กำลังโหลดสิทธิ์...</p>
        </div>

        <!-- Permission Editor Component -->
        <div v-else class="section-content">
          <PermissionEditor
            :dashboard-id="selectedDashboardId"
            :all-users="allUsers"
            :all-groups="groups"
            :all-companies="companies"
            :current-permissions="permissionsToEdit"
            :show-restrictions="false"
            @update:permissions="handlePermissionsUpdate"
          />
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="!isLoading && manageableDashboards.length > 0" class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="9" y1="3" x2="9" y2="21" />
        </svg>
        <h3>เลือกแดชบอร์ด</h3>
        <p>เลือกแดชบอร์ดเพื่อจัดการสิทธิ์การเข้าถึง</p>
      </div>

      <!-- No dashboards available -->
      <div v-else-if="!isLoading && manageableDashboards.length === 0" class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="9" y1="3" x2="9" y2="21" />
        </svg>
        <h3>ไม่มีแดชบอร์ด</h3>
        <p>ไม่พบแดชบอร์ดในโฟลเดอร์ที่คุณดูแล</p>
      </div>
    </div>
  </PageLayout>
</template>

<script setup lang="ts">
/**
 * Moderator Permission Management Page
 *
 * Allows moderators to manage dashboard permissions (Layer 1 & 2 only).
 * Scoped to dashboards within assigned folders.
 * Restrictions (Layer 3) are hidden — only admin can manage those.
 *
 * Route: /manage/permissions
 * Middleware: auth
 */

import PageLayout from '~/components/compositions/PageLayout.vue'
import PermissionEditor from '~/components/features/PermissionEditor.vue'
import { useModeratorFolders } from '~/composables/useModeratorFolders'
import { useModeratorDashboards } from '~/composables/useModeratorDashboards'
import { useAdminUsers } from '~/composables/useAdminUsers'
import { useAdminCompanies } from '~/composables/useAdminCompanies'
import { useAdminGroups } from '~/composables/useAdminGroups'
import { useDashboardService } from '~/composables/useDashboardService'
import { useAuth } from '~/composables/useAuth'
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { Dashboard, AccessControl, AccessRestrictions } from '~/types/dashboard'

definePageMeta({
  middleware: ['auth'],
  layout: 'default',
})

const router = useRouter()
const { user } = useAuth()
const dashboardService = useDashboardService()

// Composables
const { assignedFolderTree, fetchFolders: fetchModFolders, canManageFolder } = useModeratorFolders()
const { manageableDashboards, fetchDashboards } = useModeratorDashboards()
const { users: allUsers, fetchUsers } = useAdminUsers()
const { companies, fetchCompanies } = useAdminCompanies()
const { groups, fetchGroups } = useAdminGroups()

// Breadcrumbs
const breadcrumbs = computed(() => [
  { label: 'จัดการ', to: '/dashboard/discover' },
  { label: 'สิทธิ์' },
])

// State
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

// Computed
const hasChanges = computed(() => {
  return JSON.stringify(permissionsToEdit.value) !== JSON.stringify(originalPermissions.value)
})

// Lifecycle
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

  isLoading.value = true
  try {
    await Promise.all([
      fetchModFolders(),
      fetchDashboards(),
      fetchUsers(),
      fetchCompanies(),
      fetchGroups(),
    ])
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'ไม่สามารถโหลดข้อมูลได้'
    console.error('Error loading data:', err)
  } finally {
    isLoading.value = false
  }
})

// Load permissions for selected dashboard
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

    // Verify moderator can manage this dashboard's folder
    if (!canManageFolder(dashboard.folderId)) {
      errorMessage.value = 'ไม่มีสิทธิ์จัดการแดชบอร์ดนี้'
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
    errorMessage.value = err instanceof Error ? err.message : 'ไม่สามารถโหลดสิทธิ์ได้'
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
      successMessage.value = `บันทึกสิทธิ์สำหรับ "${currentDashboard.value.name}" แล้ว`
      originalPermissions.value = JSON.parse(JSON.stringify(permissionsToEdit.value))

      setTimeout(() => {
        successMessage.value = null
      }, 5000)
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

// Reset changes
const resetEditor = () => {
  permissionsToEdit.value = JSON.parse(JSON.stringify(originalPermissions.value))
}
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
