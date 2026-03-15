<script setup lang="ts">
import PageLayout from '~/components/compositions/PageLayout.vue'
import DashboardForm from '~/components/admin/forms/DashboardForm.vue'
/**
 * Moderator Dashboards Management Page
 *
 * Features:
 * - Display manageable dashboards in DataTable (scoped to assigned folders)
 * - CRUD operations with permission checks
 * - Tag display and assignment
 * - Search by name
 * - Protected by auth middleware + moderator role check
 *
 * Route: /manage/dashboards
 * Middleware: auth
 */

import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { Dashboard } from '~/types/dashboard'
import { useAuth } from '~/composables/useAuth'
import { useModeratorDashboards } from '~/composables/useModeratorDashboards'
import { useModeratorFolders } from '~/composables/useModeratorFolders'
import { useAdminTags } from '~/composables/useAdminTags'

definePageMeta({
  middleware: ['auth'],
  layout: 'default',
})

const router = useRouter()
const { user } = useAuth()

const { manageableDashboards, fetchDashboards, createDashboard, updateDashboard, deleteDashboard, loading: dashLoading } = useModeratorDashboards()
const { manageableFolders, assignedFolderTree, fetchFolders, loading: folderLoading } = useModeratorFolders()
const { tags, fetchTags } = useAdminTags()

const loading = computed(() => dashLoading.value || folderLoading.value)

const showDashboardModal = ref(false)
const showConfirmDialog = ref(false)
const selectedDashboard = ref<Dashboard | null>(null)
const dashboardToDelete = ref<Dashboard | null>(null)
const dashboardFormRef = ref<{ submit: () => Promise<void> } | null>(null)

// Filters
const searchQuery = ref('')

// Breadcrumbs
const breadcrumbs = computed(() => [
  { label: 'จัดการ', to: '/manage/dashboards' },
  { label: 'แดชบอร์ด' },
])

/**
 * Column definitions for DataTable
 */
const columns = [
  { key: 'name', label: 'ชื่อแดชบอร์ด', sortable: true, width: '220px', isNameColumn: true },
  { key: 'folderName', label: 'โฟลเดอร์', width: '180px' },
  { key: 'tagNames', label: 'แท็ก', width: '200px' },
  { key: 'updatedAt', label: 'แก้ไขล่าสุด', sortable: true, width: '150px' },
]

/**
 * Get folder name by ID
 */
const getFolderName = (folderId: string): string => {
  const folder = manageableFolders.value.find(f => f.id === folderId)
  return folder ? folder.name : folderId
}

/**
 * Filter and search dashboards
 */
const filteredDashboards = computed(() => {
  return manageableDashboards.value.filter(dashboard => {
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      if (!dashboard.name.toLowerCase().includes(query)) return false
    }
    return true
  })
})

/**
 * Enrich filtered dashboards with folder name and tag names for display
 */
const displayDashboards = computed(() =>
  filteredDashboards.value.map(dashboard => ({
    ...dashboard,
    folderName: getFolderName(dashboard.folderId),
    tagNames: (dashboard.tags ?? [])
      .map(id => tags.value.find(t => t.id === id)?.name ?? id)
      .join(', '),
  }))
)

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

const handleSaveDashboard = async (formData: Partial<Dashboard>) => {
  try {
    if (selectedDashboard.value) {
      await updateDashboard(selectedDashboard.value.id, formData)
    } else {
      await createDashboard(formData)
    }
    showDashboardModal.value = false
    selectedDashboard.value = null
  } catch (error) {
    console.error('❌ Error saving dashboard:', error)
  }
}

const confirmDeleteDashboard = async () => {
  if (!dashboardToDelete.value) return
  try {
    await deleteDashboard(dashboardToDelete.value.id)
    showConfirmDialog.value = false
    dashboardToDelete.value = null
  } catch (error) {
    console.error('❌ Error deleting dashboard:', error)
  }
}

const clearFilters = () => {
  searchQuery.value = ''
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
    await Promise.all([fetchDashboards(), fetchFolders(), fetchTags()])
  } catch (error) {
    console.error('❌ Error loading manage dashboards page:', error)
  }
})
</script>

<template>
  <PageLayout
    :folders="assignedFolderTree"
    :allow-search="true"
    :allow-create="false"
    :breadcrumbs="breadcrumbs"
  >
    <AdminPageContent>
      <template #header>
        <h1 class="page-header__title">จัดการแดชบอร์ด</h1>
        <button @click="handleAddDashboard" class="page-header-action-btn">
          ➕ เพิ่มแดชบอร์ดใหม่
        </button>
      </template>

      <template #filters>
        <div class="filter-group">
          <input
            v-model="searchQuery"
            type="text"
            class="theme-form-input"
            placeholder="ค้นหาตามชื่อแดชบอร์ด..."
          />
        </div>

        <button @click="clearFilters" class="theme-btn theme-btn--ghost">
          🔄 ล้างตัวกรอง
        </button>
      </template>

      <template #table>
        <DataTable
          :columns="columns"
          :data="displayDashboards"
          :loading="loading"
          :actions="actions"
          empty-message="ไม่พบแดชบอร์ด"
        />
      </template>

      <!-- Dashboard Form Modal -->
      <FormModal
        v-model="showDashboardModal"
        :title="selectedDashboard ? 'แก้ไขแดชบอร์ด' : 'เพิ่มแดชบอร์ดใหม่'"
        :loading="loading"
        @save="dashboardFormRef?.submit()"
        @cancel="showDashboardModal = false"
      >
        <DashboardForm
          ref="dashboardFormRef"
          :dashboard="selectedDashboard"
          :show-tag-selector="true"
          :can-create-tag="false"
          :available-tags="tags"
          :available-folders="manageableFolders"
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
    </AdminPageContent>
  </PageLayout>
</template>
