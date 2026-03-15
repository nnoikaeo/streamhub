<script setup lang="ts">
import PageLayout from '~/components/compositions/PageLayout.vue'
/**
 * Moderator Folders Management Page
 *
 * Features:
 * - Display manageable folders in DataTable (assigned folders + subfolders)
 * - CRUD operations with permission checks
 * - Dashboard count per folder
 * - Search by name
 * - Delete restricted to subfolders created by this moderator
 * - Protected by auth middleware + moderator role check
 *
 * Route: /manage/folders
 * Middleware: auth
 */

import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { Folder } from '~/types/dashboard'
import { useAuth } from '~/composables/useAuth'
import { useModeratorFolders } from '~/composables/useModeratorFolders'
import { useModeratorDashboards } from '~/composables/useModeratorDashboards'

definePageMeta({
  middleware: ['auth'],
  layout: 'default',
})

const router = useRouter()
const { user } = useAuth()

const {
  manageableFolders, assignedFolderTree, fetchFolders,
  createFolder, updateFolder, deleteFolder, canDeleteManagedFolder,
  getDashboardCount, loading: folderLoading,
} = useModeratorFolders()
const { fetchDashboards, loading: dashLoading } = useModeratorDashboards()

const loading = computed(() => folderLoading.value || dashLoading.value)

// Modal & dialog state
const showFolderModal = ref(false)
const showConfirmDialog = ref(false)
const selectedFolder = ref<Folder | null>(null)
const folderToDelete = ref<Folder | null>(null)

// Ref to FolderForm for triggering submit
const folderFormRef = ref<{ submit: () => Promise<void> } | null>(null)

// Filters
const searchQuery = ref('')

// Breadcrumbs
const breadcrumbs = computed(() => [
  { label: 'จัดการ', to: '/manage/dashboards' },
  { label: 'โฟลเดอร์' },
])

/**
 * Column definitions for DataTable
 */
const columns = [
  { key: 'name', label: 'ชื่อโฟลเดอร์', sortable: true, width: '280px', subtitleKey: 'description' },
  { key: 'parentName', label: 'โฟลเดอร์หลัก', width: '180px' },
  { key: 'dashboardCount', label: 'จำนวน Dashboard', width: '150px' },
]

/**
 * Get parent folder name by ID
 */
const getParentFolderName = (parentId: string | null): string => {
  if (!parentId) return 'Root'
  const parent = manageableFolders.value.find(f => f.id === parentId)
  return parent ? parent.name : '-'
}

/**
 * Filter and search folders
 */
const filteredFolders = computed(() => {
  return manageableFolders.value.filter(folder => {
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      if (!folder.name.toLowerCase().includes(query)) return false
    }
    return true
  })
})

/**
 * Add parentName and dashboardCount for DataTable display
 */
const displayFolders = computed(() =>
  filteredFolders.value.map(folder => ({
    ...folder,
    parentName: getParentFolderName(folder.parentId ?? null),
    dashboardCount: getDashboardCount(folder.id),
  }))
)

/**
 * Action handlers
 */
const handleAddFolder = () => {
  selectedFolder.value = null
  showFolderModal.value = true
}

const handleEditFolder = (folder: Folder) => {
  selectedFolder.value = folder
  showFolderModal.value = true
}

const handleDeleteFolder = (folder: Folder) => {
  if (!canDeleteManagedFolder(folder.id)) {
    alert('คุณไม่มีสิทธิ์ลบโฟลเดอร์นี้ (สามารถลบได้เฉพาะโฟลเดอร์ย่อยที่คุณสร้างเอง)')
    return
  }
  folderToDelete.value = folder
  showConfirmDialog.value = true
}

const handleSaveFolder = async (formData: Partial<Folder>) => {
  try {
    if (selectedFolder.value) {
      await updateFolder(selectedFolder.value.id, formData)
    } else {
      await createFolder(formData)
    }
    showFolderModal.value = false
  } catch (error) {
    console.error('❌ Error saving folder:', error)
  }
}

const confirmDeleteFolder = async () => {
  if (!folderToDelete.value) return
  try {
    await deleteFolder(folderToDelete.value.id)
    showConfirmDialog.value = false
    folderToDelete.value = null
  } catch (error) {
    console.error('❌ Error deleting folder:', error)
  }
}

const clearFilters = () => {
  searchQuery.value = ''
}

/**
 * Action buttons for table rows
 */
const actions = [
  {
    label: 'แก้ไข',
    icon: '✏️',
    onClick: handleEditFolder,
    variant: 'primary' as const,
  },
  {
    label: 'ลบ',
    icon: '🗑️',
    onClick: handleDeleteFolder,
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
    await Promise.all([fetchFolders(), fetchDashboards()])
  } catch (error) {
    console.error('❌ Error loading manage folders page:', error)
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
        <h1 class="page-header__title">จัดการโฟลเดอร์</h1>
        <button @click="handleAddFolder" class="page-header-action-btn">
          ➕ เพิ่มโฟลเดอร์ใหม่
        </button>
      </template>

      <template #filters>
        <div class="filter-group">
          <input
            v-model="searchQuery"
            type="text"
            class="theme-form-input"
            placeholder="ค้นหาตามชื่อโฟลเดอร์..."
          />
        </div>

        <button @click="clearFilters" class="theme-btn theme-btn--ghost">
          🔄 ล้างตัวกรอง
        </button>
      </template>

      <template #table>
        <DataTable
          :columns="columns"
          :data="displayFolders"
          :loading="loading"
          :actions="actions"
          empty-message="ไม่พบโฟลเดอร์"
        />
      </template>

      <!-- Folder Form Modal -->
      <FormModal
        v-model="showFolderModal"
        :title="selectedFolder ? 'แก้ไขโฟลเดอร์' : 'เพิ่มโฟลเดอร์ใหม่'"
        :loading="loading"
        @save="folderFormRef?.submit()"
        @cancel="showFolderModal = false"
      >
        <FolderForm ref="folderFormRef" :folder="selectedFolder" :all-folders="manageableFolders" @submit="handleSaveFolder" />
      </FormModal>

      <!-- Delete Confirmation Dialog -->
      <ConfirmDialog
        :is-open="showConfirmDialog"
        title="ลบโฟลเดอร์"
        :message="`คุณแน่ใจว่าต้องการลบโฟลเดอร์ '${folderToDelete?.name}' หรือไม่?`"
        :loading="loading"
        @confirm="confirmDeleteFolder"
        @cancel="showConfirmDialog = false"
      />
    </AdminPageContent>
  </PageLayout>
</template>
