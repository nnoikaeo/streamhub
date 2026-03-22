<script setup lang="ts">
import PageLayout from '~/components/compositions/PageLayout.vue'
/**
 * Admin Folders Management Page
 *
 * Features:
 * - Display all folders in DataTable
 * - CRUD operations (Create, Read, Update, Delete)
 * - Toggle active status inline via DataTable toggle switch
 * - Search by name
 * - Protected by admin middleware
 *
 * Route: /admin/folders
 * Middleware: auth, admin
 *
 * WORKFLOW:
 * 1. Page loads → auth & admin middleware checks
 * 2. onMounted → fetchFolders() loads all folders from useAdminFolders composable
 * 3. DataTable renders folders with columns (name+description, parentName, isActive toggle)
 * 4. User actions:
 *    - Click "เพิ่มโฟลเดอร์ใหม่" → handleAddFolder → showFolderModal
 *    - Click "แก้ไข" → handleEditFolder → showFolderModal with selectedFolder
 *    - Click "ลบ" → handleDeleteFolder → showConfirmDialog with folderToDelete
 *    - Toggle status → handleToggleActive → updateFolder API call
 * 5. FormModal with FolderForm → folderFormRef.submit() → validates → handleSaveFolder
 * 6. ConfirmDialog (delete) → confirmDeleteFolder → deleteFolder API call
 * 7. ConfirmDialog (toggle) → confirmToggleActive → updateFolder API call
 *
 * COMPONENTS USED:
 * - AdminPageContent: Shared layout wrapper (header, filters, table structure + styles)
 * - DataTable: Generic table component
 * - FormModal: Modal wrapper for folder form
 * - FolderForm: Form component for editing folder data
 * - ConfirmDialog: Confirmation dialog for delete action
 *
 * COMPOSABLES USED:
 * - useAdminFolders: Fetch, create, update, delete folders + buildFolderTree
 * - useAdminBreadcrumbs: Generate breadcrumb navigation
 */

import { ref, computed, onMounted } from 'vue'
import type { Folder } from '~/types/admin'
import { useAdminBreadcrumbs } from '~/composables/useAdminBreadcrumbs'
import { useAdminFolders } from '~/composables/useAdminFolders'
import { useAdminCrudPage } from '~/composables/useAdminCrudPage'

definePageMeta({
  middleware: ['auth', 'admin'],
  layout: 'default',
})

console.log('📄 [admin/folders/index.vue] Folders management page initialized')

const { breadcrumbs } = useAdminBreadcrumbs()
const { folders, loading, fetchFolders, createFolder, updateFolder, deleteFolder, buildFolderTree } = useAdminFolders()

// CRUD page state (modal, dialog, handlers)
const {
  showFormModal: showFolderModal,
  showConfirmDialog,
  showToggleDialog,
  selectedItem: selectedFolder,
  itemToDelete: folderToDelete,
  itemToToggle: folderToToggle,
  formRef: folderFormRef,
  handleAdd: handleAddFolder,
  handleEdit: handleEditFolder,
  handleDelete: handleDeleteFolder,
  handleToggleActive,
  confirmToggleActive,
  handleSave: handleSaveFolder,
  confirmDelete: confirmDeleteFolder,
} = useAdminCrudPage<Folder>({
  idKey: 'id',
  displayKey: 'name',
  createFn: createFolder,
  updateFn: updateFolder,
  deleteFn: deleteFolder,
})

// Filters
const searchQuery = ref('')
const filterActive = ref<boolean | null>(null)

/**
 * Column definitions for DataTable
 * - Name: folder name with description as subtitle
 * - Parent: parent folder name
 * - Status toggle switch (green when enabled, uses isStatusColumn)
 * - Actions (icons only)
 */
const columns = [
  { key: 'name', label: 'ชื่อโฟลเดอร์', sortable: true, width: '280px', subtitleKey: 'description' },
  { key: 'parentName', label: 'โฟลเดอร์หลัก', width: '180px' },
  { key: 'isActive', label: 'สถานะ', sortable: true, width: '100px', isStatusColumn: true },
]

const getParentFolderName = (parentId: string | null): string => {
  if (!parentId) return 'Root'
  const parent = folders.value.find(f => f.id === parentId)
  return parent ? parent.name : '-'
}

/**
 * Filter and search folders
 */
const filteredFolders = computed(() => {
  return folders.value.filter(folder => {
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      if (!folder.name.toLowerCase().includes(query)) return false
    }

    if (filterActive.value !== null && folder.isActive !== filterActive.value) {
      return false
    }

    return true
  })
})

/**
 * Add parentName field for DataTable display
 */
const displayFolders = computed(() =>
  filteredFolders.value.map(folder => ({
    ...folder,
    parentName: getParentFolderName(folder.parentId ?? null),
  }))
)

const clearFilters = () => {
  searchQuery.value = ''
  filterActive.value = null
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
  try {
    console.log('🚀 [Lifecycle] onMounted - Starting to fetch folders...')
    await fetchFolders()
    console.log('✅ [Lifecycle] onMounted - Folders fetched successfully')
  } catch (error) {
    console.error('❌ [Lifecycle] Error loading folders:', error)
  }
})

/**
 * Folder tree for sidebar — built via shared buildFolderTree from useAdminFolders
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

        <div class="filter-group">
          <select v-model="filterActive" class="theme-form-select">
            <option :value="null">-- สถานะทั้งหมด --</option>
            <option :value="true">เปิดใช้งาน</option>
            <option :value="false">ปิดใช้งาน</option>
          </select>
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
          @toggleActive="handleToggleActive"
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
        <FolderForm ref="folderFormRef" :folder="selectedFolder" :all-folders="folders" @submit="handleSaveFolder" />
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

      <!-- Toggle Active Confirmation Dialog -->
      <ConfirmDialog
        :is-open="showToggleDialog"
        :title="folderToToggle?.isActive ? 'ปิดใช้งานโฟลเดอร์' : 'เปิดใช้งานโฟลเดอร์'"
        :message="folderToToggle?.isActive
          ? `คุณต้องการปิดใช้งานโฟลเดอร์ '${folderToToggle?.name}' หรือไม่?`
          : `คุณต้องการเปิดใช้งานโฟลเดอร์ '${folderToToggle?.name}' หรือไม่?`"
        :confirm-text="folderToToggle?.isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน'"
        :is-danger="folderToToggle?.isActive"
        :loading="loading"
        @confirm="confirmToggleActive"
        @cancel="showToggleDialog = false; folderToToggle = null"
      />
    </AdminPageContent>
  </PageLayout>
</template>
