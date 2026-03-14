<script setup lang="ts">
import PageLayout from '~/components/compositions/PageLayout.vue'
import DashboardForm from '~/components/admin/forms/DashboardForm.vue'
/**
 * Moderator Manage Folder Page
 *
 * Allows moderators to manage dashboards and subfolders within an assigned folder.
 *
 * Features:
 * - View subfolders and dashboards scoped to the current folder
 * - CRUD operations for dashboards (with tag assignment)
 * - Create subfolders
 * - Permission-gated: redirects to /dashboard/discover if not manageable
 *
 * Route: /manage/folders/:folderId
 * Middleware: auth
 */

import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Dashboard, Folder } from '~/types/dashboard'
import { useModeratorFolders } from '~/composables/useModeratorFolders'
import { useModeratorDashboards } from '~/composables/useModeratorDashboards'
import { useAdminFolders } from '~/composables/useAdminFolders'
import { useAdminTags } from '~/composables/useAdminTags'

definePageMeta({
  middleware: ['auth'],
  layout: 'default',
})

const route = useRoute()
const router = useRouter()

const folderId = computed(() => route.params.folderId as string)

const { assignedFolderTree, fetchFolders, canManageFolder, loading: folderLoading } = useModeratorFolders()
const { getDashboardsByFolder, fetchDashboards, createDashboard, updateDashboard, deleteDashboard, loading: dashLoading } = useModeratorDashboards()
const { folders, createFolder, getFolderPath, getChildFolders } = useAdminFolders()
const { tags, fetchTags } = useAdminTags()

const loading = computed(() => folderLoading.value || dashLoading.value)

// Dashboard modal state
const showDashboardModal = ref(false)
const showConfirmDialog = ref(false)
const selectedDashboard = ref<Dashboard | null>(null)
const dashboardToDelete = ref<Dashboard | null>(null)
const dashboardFormRef = ref<{ submit: () => Promise<void> } | null>(null)

// Subfolder modal state
const showSubfolderModal = ref(false)
const subfolderName = ref('')
const subfolderDescription = ref('')
const subfolderLoading = ref(false)

/**
 * Column definitions for dashboard DataTable
 */
const columns = [
  { key: 'name', label: 'ชื่อแดชบอร์ด', sortable: true, width: '220px', isNameColumn: true },
  { key: 'tagNames', label: 'Tags', width: '200px' },
  { key: 'updatedAt', label: 'แก้ไขล่าสุด', sortable: true, width: '150px' },
]

/**
 * Current folder object
 */
const currentFolder = computed(() =>
  folders.value.find(f => f.id === folderId.value) ?? null
)

/**
 * Breadcrumb built from folder path
 */
const breadcrumbs = computed(() => {
  const path = getFolderPath(folderId.value)
  const crumbs = [{ label: 'จัดการ', to: '/dashboard/discover' }]
  path.forEach((folder, index) => {
    if (index < path.length - 1) {
      crumbs.push({ label: folder.name, to: `/manage/folders/${folder.id}` })
    } else {
      crumbs.push({ label: folder.name })
    }
  })
  return crumbs
})

/**
 * Direct child folders of the current folder (that are manageable)
 */
const childFolders = computed(() =>
  getChildFolders(folderId.value).filter((f: Folder) => canManageFolder(f.id))
)

/**
 * Dashboards in the current folder with resolved tag names
 */
const displayDashboards = computed(() =>
  getDashboardsByFolder(folderId.value).map(d => ({
    ...d,
    tagNames: (d.tags ?? [])
      .map(id => tags.value.find(t => t.id === id)?.name ?? id)
      .join(', '),
  }))
)

// Search
const searchQuery = ref('')
const filteredDashboards = computed(() => {
  if (!searchQuery.value) return displayDashboards.value
  const q = searchQuery.value.toLowerCase()
  return displayDashboards.value.filter(d => d.name.toLowerCase().includes(q))
})

/**
 * Dashboard action handlers
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
      await createDashboard({ ...formData, folderId: folderId.value })
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

const dashboardActions = [
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

/**
 * Subfolder handlers
 */
const handleAddSubfolder = () => {
  subfolderName.value = ''
  subfolderDescription.value = ''
  showSubfolderModal.value = true
}

const handleSaveSubfolder = async () => {
  if (!subfolderName.value.trim()) return
  subfolderLoading.value = true
  try {
    await createFolder({
      name: subfolderName.value.trim(),
      description: subfolderDescription.value.trim(),
      parentId: folderId.value,
    })
    showSubfolderModal.value = false
  } catch (error) {
    console.error('❌ Error creating subfolder:', error)
  } finally {
    subfolderLoading.value = false
  }
}

onMounted(async () => {
  try {
    await Promise.all([fetchFolders(), fetchDashboards(), fetchTags()])
    if (!canManageFolder(folderId.value)) {
      console.warn('⛔ No permission to manage folder:', folderId.value)
      await router.push('/dashboard/discover')
    }
  } catch (error) {
    console.error('❌ Error loading manage folder page:', error)
  }
})
</script>

<template>
  <PageLayout
    :folders="assignedFolderTree"
    :allow-search="false"
    :allow-create="false"
    :breadcrumbs="breadcrumbs"
  >
    <div class="manage-content">
      <!-- Page Header -->
      <div class="page-header">
        <h1 class="page-header__title">📁 จัดการ: {{ currentFolder?.name ?? '...' }}</h1>
        <button @click="handleAddDashboard" class="page-header-action-btn">
          ➕ สร้าง Dashboard
        </button>
      </div>

      <!-- Subfolders Section -->
      <div class="section">
        <div class="section-header">
          <h2 class="section-title">โฟลเดอร์ย่อย</h2>
          <button @click="handleAddSubfolder" class="theme-btn theme-btn--ghost">
            ➕ สร้าง Subfolder
          </button>
        </div>

        <div v-if="childFolders.length > 0" class="subfolder-grid">
          <NuxtLink
            v-for="folder in childFolders"
            :key="folder.id"
            :to="`/manage/folders/${folder.id}`"
            class="subfolder-card"
          >
            <span class="subfolder-card__icon">📁</span>
            <span class="subfolder-card__name">{{ folder.name }}</span>
          </NuxtLink>
        </div>
        <p v-else class="empty-text">ไม่มีโฟลเดอร์ย่อย</p>
      </div>

      <!-- Dashboards Section -->
      <div class="section">
        <div class="section-header">
          <h2 class="section-title">Dashboards ({{ filteredDashboards.length }})</h2>
          <input
            v-model="searchQuery"
            type="text"
            class="theme-form-input search-input"
            placeholder="🔍 ค้นหา..."
          />
        </div>

        <div class="table-section">
          <DataTable
            :columns="columns"
            :data="filteredDashboards"
            :loading="loading"
            :actions="dashboardActions"
            empty-message="ไม่พบแดชบอร์ด"
          />
        </div>
      </div>

      <!-- Dashboard Form Modal -->
      <FormModal
        v-model="showDashboardModal"
        :title="selectedDashboard ? 'แก้ไขแดชบอร์ด' : 'สร้าง Dashboard ใหม่'"
        :loading="loading"
        @save="dashboardFormRef?.submit()"
        @cancel="showDashboardModal = false"
      >
        <DashboardForm
          ref="dashboardFormRef"
          :dashboard="selectedDashboard"
          :locked-folder-id="folderId"
          :show-tag-selector="true"
          :can-create-tag="false"
          :available-tags="tags"
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

      <!-- Subfolder Create Modal -->
      <FormModal
        v-model="showSubfolderModal"
        title="สร้างโฟลเดอร์ย่อย"
        :loading="subfolderLoading"
        @save="handleSaveSubfolder"
        @cancel="showSubfolderModal = false"
      >
        <div class="subfolder-form">
          <div class="form-group">
            <label class="form-label">ชื่อโฟลเดอร์ <span class="required">*</span></label>
            <input
              v-model="subfolderName"
              type="text"
              class="theme-form-input"
              placeholder="ชื่อโฟลเดอร์ย่อย"
            />
          </div>
          <div class="form-group">
            <label class="form-label">คำอธิบาย</label>
            <textarea
              v-model="subfolderDescription"
              class="theme-form-input"
              rows="3"
              placeholder="คำอธิบายโฟลเดอร์ (ไม่บังคับ)"
            />
          </div>
        </div>
      </FormModal>
    </div>
  </PageLayout>
</template>

<style scoped>
.manage-content {
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

.page-header__title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.section {
  margin-bottom: var(--spacing-xl, 2rem);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md, 1rem);
  gap: var(--spacing-md, 1rem);
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.subfolder-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md, 1rem);
}

.subfolder-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm, 0.5rem);
  padding: var(--spacing-sm, 0.5rem) var(--spacing-md, 1rem);
  background-color: var(--color-bg-secondary, #f3f4f6);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-md, 0.375rem);
  text-decoration: none;
  color: var(--color-text-primary);
  font-size: 0.9rem;
  transition: all var(--transition-fast);
}

.subfolder-card:hover {
  background-color: var(--color-bg-hover, #e5e7eb);
  border-color: var(--color-primary);
}

.subfolder-card__icon {
  font-size: 1rem;
}

.subfolder-card__name {
  font-weight: 500;
}

.empty-text {
  color: var(--color-text-secondary, #6b7280);
  font-size: 0.9rem;
  margin: 0;
}

.table-section {
  background-color: var(--color-bg-primary, #ffffff);
  border-radius: var(--radius-lg, 0.5rem);
  box-shadow: var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
  overflow: hidden;
}

.search-input {
  width: 240px;
}

.subfolder-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg, 1.5rem);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs, 0.25rem);
}

.form-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text-primary);
}

.required {
  color: var(--color-danger, #ef4444);
}

@media (max-width: 768px) {
  .manage-content {
    padding: var(--spacing-lg, 1.25rem) var(--spacing-md, 1rem);
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .search-input {
    width: 100%;
  }
}
</style>
