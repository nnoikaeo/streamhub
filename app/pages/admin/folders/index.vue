<script setup lang="ts">
import PageLayout from '~/components/compositions/PageLayout.vue'
/**
 * Admin Folders Management Page
 *
 * Features:
 * - Display all folders in DataTable
 * - CRUD operations
 * - Filter by company
 * - Search by name
 * - Protected by admin middleware
 *
 * Route: /admin/folders
 * Middleware: auth, admin
 */

import { ref, computed, onMounted } from 'vue'
import type { Folder } from '~/types/dashboard'
import { useAdminBreadcrumbs } from '~/composables/useAdminBreadcrumbs'
import { useAdminFolders } from '~/composables/useAdminFolders'
import { useAdminCompanies } from '~/composables/useAdminCompanies'

definePageMeta({
  middleware: ['auth', 'admin'],
  layout: 'default',
})

const { breadcrumbs } = useAdminBreadcrumbs()
const { folders, loading, fetchFolders, updateFolder, deleteFolder } = useAdminFolders()
const { companies } = useAdminCompanies()

console.log('📄 [admin/folders/index.vue] Folders management page mounted')
const showFolderModal = ref(false)
const showConfirmDialog = ref(false)
const selectedFolder = ref<Folder | null>(null)
const folderToDelete = ref<Folder | null>(null)

const searchQuery = ref('')
const filterCompany = ref<string | null>(null)

const columns = [
  { key: 'name', label: 'ชื่อโฟลเดอร์', sortable: true, width: '200px' },
  { key: 'company', label: 'บริษัท', sortable: true, width: '120px' },
  { key: 'parentId', label: 'โฟลเดอร์หลัก', width: '180px' },
  { key: 'description', label: 'คำอธิบาย', width: '250px' },
  { key: 'createdAt', label: 'สร้างเมื่อ', sortable: true, width: '150px' },
]

const getParentFolderName = (parentId: string | null): string => {
  if (!parentId) return 'Root'
  const parent = folders.value.find(f => f.id === parentId)
  return parent ? parent.name : '-'
}

const filteredFolders = computed(() => {
  return folders.value.filter(folder => {
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      if (!folder.name.toLowerCase().includes(query)) return false
    }

    if (filterCompany.value && folder.company !== filterCompany.value) {
      return false
    }

    return true
  })
})

const handleAddFolder = () => {
  selectedFolder.value = null
  showFolderModal.value = true
}

const handleEditFolder = (folder: Folder) => {
  selectedFolder.value = folder
  showFolderModal.value = true
}

const handleDeleteFolder = (folder: Folder) => {
  folderToDelete.value = folder
  showConfirmDialog.value = true
}

const handleSaveFolder = async (formData: any) => {
  try {
    if (selectedFolder.value) {
      await updateFolder(selectedFolder.value.id, formData)
      console.log(`✅ Folder updated: ${formData.name}`)
    } else {
      console.warn('Create folder not yet implemented')
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
    console.log(`✅ Folder deleted: ${folderToDelete.value.name}`)
    showConfirmDialog.value = false
    folderToDelete.value = null
  } catch (error) {
    console.error('❌ Error deleting folder:', error)
  }
}

const clearFilters = () => {
  searchQuery.value = ''
  filterCompany.value = null
}

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
    await fetchFolders()
  } catch (error) {
    console.error('Error loading folders:', error)
  }
})

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
</script>

<template>
  <PageLayout
    :folders="folderTree"
    :allow-search="true"
    :allow-create="false"
    :breadcrumbs="breadcrumbs"
  >
    <div class="admin-content">
        <div class="page-header">
          <h1 class="page-header__title">จัดการโฟลเดอร์</h1>
          <button @click="handleAddFolder" class="page-header-action-btn">
            ➕ เพิ่มโฟลเดอร์ใหม่
          </button>
        </div>

        <div class="filters-section">
          <div class="filters-row">
            <div class="filter-group">
              <input
                v-model="searchQuery"
                type="text"
                class="theme-form-input"
                placeholder="ค้นหาตามชื่อโฟลเดอร์..."
              />
            </div>

            <div class="filter-group">
              <select v-model="filterCompany" class="theme-form-select">
                <option :value="null">-- บริษัททั้งหมด --</option>
                <option v-for="c in companies" :key="c.code" :value="c.code">
                  {{ c.code }}
                </option>
              </select>
            </div>

            <button @click="clearFilters" class="theme-btn theme-btn--ghost">
              🔄 ล้างตัวกรอง
            </button>
          </div>

          <div class="filter-info">
            <span class="results-count">
              แสดง {{ filteredFolders.length }} จาก {{ folders.length }} โฟลเดอร์
            </span>
          </div>
        </div>

        <div class="table-section">
          <DataTable
            :columns="columns"
            :data="filteredFolders"
            :loading="loading"
            :actions="actions"
            empty-message="ไม่พบโฟลเดอร์"
          />
        </div>

        <FormModal
          v-model="showFolderModal"
          :title="selectedFolder ? 'แก้ไขโฟลเดอร์' : 'เพิ่มโฟลเดอร์ใหม่'"
          :loading="loading"
          @save="handleSaveFolder"
          @cancel="showFolderModal = false"
        >
          <FolderForm :folder="selectedFolder" :all-folders="folders" @submit="handleSaveFolder" />
        </FormModal>

        <ConfirmDialog
          :is-open="showConfirmDialog"
          title="ลบโฟลเดอร์"
          :message="`คุณแน่ใจว่าต้องการลบโฟลเดอร์ '${folderToDelete?.name}' หรือไม่?`"
          :loading="loading"
          @confirm="confirmDeleteFolder"
          @cancel="showConfirmDialog = false"
        />
    </div>
  </PageLayout>
</template>

<style scoped>
.admin-content { padding: var(--spacing-xl, 2rem) var(--spacing-lg, 1.25rem); max-width: 1400px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-xl, 2rem); gap: var(--spacing-md, 1rem); }
.filters-section { background-color: var(--color-bg-primary, #ffffff); padding: var(--spacing-xs); border-radius: var(--radius-lg, 0.5rem); margin-bottom: var(--spacing-lg, 1.25rem); box-shadow: var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05)); }
.filters-row { display: flex; gap: var(--spacing-md, 1rem); flex-wrap: wrap; margin-bottom: var(--spacing-md, 1rem); }
.filter-group { flex: 1; min-width: 200px; }
.filter-info { display: flex; justify-content: space-between; align-items: center; font-size: 0.9rem; color: var(--color-text-secondary, #6b7280); }
.results-count { font-weight: 500; }
.table-section { background-color: var(--color-bg-primary, #ffffff); border-radius: var(--radius-lg, 0.5rem); box-shadow: var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05)); overflow: hidden; }
@media (max-width: 768px) { .admin-content { padding: var(--spacing-lg, 1.25rem) var(--spacing-md, 1rem); } .page-header { flex-direction: column; align-items: flex-start; } .filters-row { flex-direction: column; } .filter-group { min-width: auto; } }
</style>
