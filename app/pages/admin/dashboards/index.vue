<script setup lang="ts">
import PageLayout from '~/components/compositions/PageLayout.vue'
/**
 * Admin Dashboards Management Page
 *
 * Features:
 * - Display all dashboards in DataTable
 * - CRUD operations
 * - Filter by type, folder, owner, archived status
 * - Search by name
 * - Protected by admin middleware
 *
 * Route: /admin/dashboards
 * Middleware: auth, admin
 */

import { ref, computed, onMounted } from 'vue'
import type { Dashboard } from '~/types/dashboard'
import { useAdminDashboards } from '~/composables/useAdminDashboards'
import { useAdminFolders } from '~/composables/useAdminFolders'
import { useAdminBreadcrumbs } from '~/composables/useAdminBreadcrumbs'

definePageMeta({
  middleware: ['auth', 'admin'],
  layout: 'default',
})

const { breadcrumbs } = useAdminBreadcrumbs()
const { dashboards, loading, fetchDashboards, createDashboard, updateDashboard, deleteDashboard } = useAdminDashboards()
const { folders, fetchFolders } = useAdminFolders()

console.log('📄 [admin/dashboards/index.vue] Dashboards management page mounted')
const showDashboardModal = ref(false)
const showConfirmDialog = ref(false)
const selectedDashboard = ref<Dashboard | null>(null)
const dashboardToDelete = ref<Dashboard | null>(null)

// Filters
const searchQuery = ref('')
const filterType = ref<string | null>(null)
const filterArchived = ref<boolean | null>(null)

/**
 * Column definitions for DataTable
 */
const columns = [
  { key: 'name', label: 'ชื่อแดชบอร์ด', sortable: true, width: '200px' },
  { key: 'type', label: 'ประเภท', sortable: true, width: '120px' },
  { key: 'folderId', label: 'โฟลเดอร์', width: '150px' },
  { key: 'owner', label: 'เจ้าของ', sortable: true, width: '150px' },
  { key: 'createdAt', label: 'สร้างเมื่อ', sortable: true, width: '150px' },
  { key: 'isArchived', label: 'สถานะ', sortable: true, width: '100px' },
]

/**
 * Get folder name by ID
 */
const getFolderName = (folderId: string): string => {
  const folder = folders.value.find(f => f.id === folderId)
  return folder ? folder.name : '-'
}

/**
 * Filter and search dashboards
 */
const filteredDashboards = computed(() => {
  return dashboards.value.filter(dashboard => {
    // Search filter
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      if (!dashboard.name.toLowerCase().includes(query)) return false
    }

    // Type filter
    if (filterType.value && dashboard.type !== filterType.value) {
      return false
    }

    // Archived filter
    if (filterArchived.value !== null && dashboard.isArchived !== filterArchived.value) {
      return false
    }

    return true
  })
})

/**
 * Action handlers
 */
const handleAddDashboard = () => {
  selectedDashboard.value = null
  showDashboardModal.value = true
}

const handleEditDashboard = (dashboard: Dashboard) => {
  selectedDashboard.value = dashboard
  showDashboardModal.value = true
}

const handleDeleteDashboard = (dashboard: Dashboard) => {
  dashboardToDelete.value = dashboard
  showConfirmDialog.value = true
}

const handleToggleArchive = async (dashboard: Dashboard) => {
  try {
    await updateDashboard(dashboard.id, {
      isArchived: !dashboard.isArchived,
      archivedAt: !dashboard.isArchived ? new Date() : undefined
    })

    console.log(`✅ Dashboard ${dashboard.name} archived status toggled`)
  } catch (error) {
    console.error('❌ Error toggling dashboard:', error)
  }
}

const handleSaveDashboard = async (formData: any) => {
  try {
    if (selectedDashboard.value) {
      await updateDashboard(selectedDashboard.value.id, formData)
      console.log(`✅ Dashboard updated: ${formData.name}`)
    } else {
      await createDashboard(formData)
      console.log(`✅ Dashboard created: ${formData.name}`)
    }

    showDashboardModal.value = false
  } catch (error) {
    console.error('❌ Error saving dashboard:', error)
  }
}

const confirmDeleteDashboard = async () => {
  if (!dashboardToDelete.value) return

  try {
    await deleteDashboard(dashboardToDelete.value.id)
    console.log(`✅ Dashboard deleted: ${dashboardToDelete.value.name}`)

    showConfirmDialog.value = false
    dashboardToDelete.value = null
  } catch (error) {
    console.error('❌ Error deleting dashboard:', error)
  }
}

const clearFilters = () => {
  searchQuery.value = ''
  filterType.value = null
  filterArchived.value = null
}

const actions = [
  {
    label: 'แก้ไข',
    icon: '✏️',
    onClick: handleEditDashboard,
    variant: 'primary' as const,
  },
  {
    label: 'ลบ',
    icon: '🗑️',
    onClick: handleDeleteDashboard,
    variant: 'danger' as const,
  },
]

onMounted(async () => {
  try {
    await Promise.all([fetchDashboards(), fetchFolders()])
  } catch (error) {
    console.error('Error loading dashboards:', error)
  }
})

/**
 * Build folder tree hierarchy with children from flat folders array
 * Converts flat folders to tree structure for FolderTree component
 */
const buildFolderTree = (flatFolders: any[]): any[] => {
  const folderMap = new Map<string, any>()

  // First pass: create enhanced folder objects with empty children arrays
  for (const folder of flatFolders) {
    folderMap.set(folder.id, {
      ...folder,
      children: []
    })
  }

  // Second pass: build parent-child relationships
  const rootFolders: any[] = []
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
</script>

<template>
  <PageLayout
    :folders="folderTree"
    :allow-search="true"
    :allow-create="false"
    :breadcrumbs="breadcrumbs"
  >
    <div class="admin-content">
        <!-- Page Header -->
        <div class="page-header">
          <h1 class="page-title">จัดการแดชบอร์ด</h1>
          <button @click="handleAddDashboard" class="btn btn--primary">
            ➕ เพิ่มแดชบอร์ดใหม่
          </button>
        </div>

        <!-- Filters -->
        <div class="filters-section">
          <div class="filters-row">
            <!-- Search -->
            <div class="filter-group">
              <input
                v-model="searchQuery"
                type="text"
                class="filter-input"
                placeholder="ค้นหาตามชื่อแดชบอร์ด..."
              />
            </div>

            <!-- Type Filter -->
            <div class="filter-group">
              <select v-model="filterType" class="filter-select">
                <option :value="null">-- ประเภททั้งหมด --</option>
                <option value="looker">Looker</option>
                <option value="custom">Custom</option>
                <option value="external">External</option>
              </select>
            </div>

            <!-- Archive Filter -->
            <div class="filter-group">
              <select v-model="filterArchived" class="filter-select">
                <option :value="null">-- สถานะทั้งหมด --</option>
                <option :value="false">ใช้งานอยู่</option>
                <option :value="true">เก็บถาวร</option>
              </select>
            </div>

            <!-- Clear Filters -->
            <button @click="clearFilters" class="btn btn--ghost">
              🔄 ล้างตัวกรอง
            </button>
          </div>

          <!-- Results Count -->
          <div class="filter-info">
            <span class="results-count">
              แสดง {{ filteredDashboards.length }} จาก {{ dashboards.length }} แดชบอร์ด
            </span>
          </div>
        </div>

        <!-- Dashboards Table -->
        <div class="table-section">
          <DataTable
            :columns="columns"
            :data="filteredDashboards"
            :loading="loading"
            :actions="actions"
            empty-message="ไม่พบแดชบอร์ด"
          />
        </div>

        <!-- Dashboard Form Modal -->
        <FormModal
          v-model="showDashboardModal"
          :title="selectedDashboard ? 'แก้ไขแดชบอร์ด' : 'เพิ่มแดชบอร์ดใหม่'"
          :loading="loading"
          @save="handleSaveDashboard"
          @cancel="showDashboardModal = false"
        >
          <DashboardForm :dashboard="selectedDashboard" @submit="handleSaveDashboard" />
        </FormModal>

        <!-- Delete Confirmation Dialog -->
        <ConfirmDialog
          :is-open="showConfirmDialog"
          title="ลบแดชบอร์ด"
          :message="`คุณแน่ใจว่าต้องการลบแดชบอร์ด '${dashboardToDelete?.name}' หรือไม่?`"
          :loading="loading"
          @confirm="confirmDeleteDashboard"
          @cancel="showConfirmDialog = false"
        />
    </div>
  </PageLayout>
</template>

<style scoped>
.admin-page {
  min-height: 100vh;
}

.admin-content {
  padding: var(--spacing-xl, 2rem) var(--spacing-lg, 1.25rem);
  max-width: 1400px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl, 2rem);
  gap: var(--spacing-md, 1rem);
}

.page-title {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-text-primary, #1f2937);
}

.btn {
  padding: var(--spacing-sm, 0.5rem) var(--spacing-lg, 1rem);
  border-radius: var(--radius-md, 0.375rem);
  font-size: 0.95rem;
  font-weight: 600;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all var(--transition-base, 0.2s ease);
}

.btn--primary {
  background-color: var(--color-primary, #3b82f6);
  color: white;
}

.btn--primary:hover {
  background-color: #2563eb;
  box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
}

.btn--ghost {
  background-color: transparent;
  color: var(--color-text-secondary, #6b7280);
  border-color: var(--color-border-light, #e5e7eb);
}

.btn--ghost:hover {
  background-color: var(--color-bg-secondary, #f3f4f6);
  color: var(--color-text-primary, #1f2937);
}

.filters-section {
  background-color: var(--color-bg-primary, #ffffff);
  padding: var(--spacing-lg, 1.25rem);
  border-radius: var(--radius-lg, 0.5rem);
  margin-bottom: var(--spacing-lg, 1.25rem);
  box-shadow: var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
}

.filters-row {
  display: flex;
  gap: var(--spacing-md, 1rem);
  flex-wrap: wrap;
  margin-bottom: var(--spacing-md, 1rem);
}

.filter-group {
  flex: 1;
  min-width: 200px;
}

.filter-input,
.filter-select {
  width: 100%;
  padding: var(--spacing-sm, 0.5rem) var(--spacing-md, 1rem);
  border: 1px solid var(--color-border-light, #e5e7eb);
  border-radius: var(--radius-md, 0.375rem);
  font-size: 0.95rem;
  background-color: var(--color-bg-primary, #ffffff);
  color: var(--color-text-primary, #1f2937);
  transition: all var(--transition-base, 0.2s ease);
}

.filter-input:focus,
.filter-select:focus {
  outline: none;
  border-color: var(--color-primary, #3b82f6);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.filter-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  color: var(--color-text-secondary, #6b7280);
}

.results-count {
  font-weight: 500;
}

.table-section {
  background-color: var(--color-bg-primary, #ffffff);
  border-radius: var(--radius-lg, 0.5rem);
  box-shadow: var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
  overflow: hidden;
}

@media (max-width: 768px) {
  .admin-content {
    padding: var(--spacing-lg, 1.25rem) var(--spacing-md, 1rem);
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .filters-row {
    flex-direction: column;
  }

  .filter-group {
    min-width: auto;
  }
}
</style>
