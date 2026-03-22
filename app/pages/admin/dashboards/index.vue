<script setup lang="ts">
import PageLayout from '~/components/compositions/PageLayout.vue'
import DashboardForm from '~/components/admin/forms/DashboardForm.vue'
/**
 * Admin Dashboards Management Page
 *
 * Features:
 * - Display all dashboards in DataTable
 * - CRUD operations
 * - Filter by folder, owner, archived status
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
import { useAdminUsers } from '~/composables/useAdminUsers'
import { useAdminTags } from '~/composables/useAdminTags'
import { useAdminBreadcrumbs } from '~/composables/useAdminBreadcrumbs'
import { useAdminCrudPage } from '~/composables/useAdminCrudPage'

definePageMeta({
  middleware: ['auth', 'admin'],
  layout: 'default',
})

const { breadcrumbs } = useAdminBreadcrumbs()
const { dashboards, loading, fetchDashboards, createDashboard, updateDashboard, deleteDashboard } = useAdminDashboards()
const { folders, fetchFolders, buildFolderTree } = useAdminFolders()
const { users, fetchUsers } = useAdminUsers()
const { tags, fetchTags } = useAdminTags()

// CRUD page state (modal, dialog, handlers)
const {
  showFormModal: showDashboardModal,
  showConfirmDialog,
  selectedItem: selectedDashboard,
  itemToDelete: dashboardToDelete,
  handleAdd: handleAddDashboard,
  handleEdit: handleEditDashboard,
  handleDelete: handleDeleteDashboard,
  handleSave: handleSaveDashboard,
  confirmDelete: confirmDeleteDashboard,
} = useAdminCrudPage<Dashboard>({
  idKey: 'id',
  displayKey: 'name',
  createFn: createDashboard,
  updateFn: updateDashboard,
  deleteFn: deleteDashboard,
  resourceLabel: 'แดชบอร์ด',
})

// Filters
const searchQuery = ref('')
const filterArchived = ref<boolean | null>(null)

/**
 * Column definitions for DataTable
 */
const columns = [
  { key: 'name', label: 'ชื่อแดชบอร์ด', sortable: true, width: '200px', isNameColumn: true },
  { key: 'folderName', label: 'โฟลเดอร์', width: '180px' },
  { key: 'ownerName', label: 'เจ้าของ', sortable: true, width: '150px' },
  { key: 'createdAt', label: 'สร้างเมื่อ', sortable: true, width: '150px' },
  { key: 'isArchived', label: 'สถานะ', sortable: true, width: '100px', isStatusColumn: true },
]

/**
 * Get folder name by ID
 */
const getFolderName = (folderId: string): string => {
  const folder = folders.value.find(f => f.id === folderId)
  return folder ? folder.name : folderId
}

/**
 * Get owner display name by UID
 */
const getOwnerName = (uid: string): string => {
  const user = users.value.find(u => u.uid === uid)
  return user ? user.name : uid
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

    // Archived filter
    if (filterArchived.value !== null && dashboard.isArchived !== filterArchived.value) {
      return false
    }

    return true
  })
})

/**
 * Enrich filtered dashboards with resolved folder name and owner name
 * for display in DataTable
 */
const displayDashboards = computed(() =>
  filteredDashboards.value.map(dashboard => ({
    ...dashboard,
    folderName: getFolderName(dashboard.folderId),
    ownerName: getOwnerName(dashboard.owner),
  }))
)

/**
 * Toggle archive status (page-specific — not a generic active toggle)
 */
const handleToggleArchive = async (dashboard: Dashboard) => {
  try {
    await updateDashboard(dashboard.id, {
      isArchived: !dashboard.isArchived,
      archivedAt: !dashboard.isArchived ? new Date() : undefined
    })
  } catch (error) {
    console.error('❌ Error toggling dashboard:', error)
  }
}

const clearFilters = () => {
  searchQuery.value = ''
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
    await Promise.all([fetchDashboards(), fetchFolders(), fetchUsers(), fetchTags()])
  } catch (error) {
    console.error('Error loading dashboards:', error)
  }
})

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
          <h1 class="page-header__title">จัดการแดชบอร์ด</h1>
          <button @click="handleAddDashboard" class="page-header-action-btn">
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
                class="theme-form-input"
                placeholder="ค้นหาตามชื่อแดชบอร์ด..."
              />
            </div>

            <!-- Archive Filter -->
            <div class="filter-group">
              <select v-model="filterArchived" class="theme-form-select">
                <option :value="null">-- สถานะทั้งหมด --</option>
                <option :value="false">ใช้งานอยู่</option>
                <option :value="true">เก็บถาวร</option>
              </select>
            </div>

            <!-- Clear Filters -->
            <button @click="clearFilters" class="theme-btn theme-btn--ghost">
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
            :data="displayDashboards"
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
          <DashboardForm
            :dashboard="selectedDashboard"
            :show-tag-selector="true"
            :can-create-tag="true"
            :available-tags="tags"
            :available-folders="folders"
            :all-users="users"
            @submit="handleSaveDashboard"
          />
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

.filters-section {
  background-color: var(--color-bg-primary, #ffffff);
  padding: var(--spacing-xs);
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

@media (min-width: 768px) and (max-width: 1024px) {
  .filters-row {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
  }
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
