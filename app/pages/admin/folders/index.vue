<script setup lang="ts">
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
import { mockFolders, mockCompanies } from '~/composables/useMockData'
import AdminSidebar from '~/components/admin/AdminSidebar.vue'

definePageMeta({
  middleware: ['auth', 'admin'],
  layout: 'default',
})

console.log('📄 [admin/folders/index.vue] Folders management page mounted')

const folders = ref<Folder[]>([...mockFolders])
const loading = ref(false)
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
  const parent = mockFolders.find(f => f.id === parentId)
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
  loading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 500))

    if (selectedFolder.value) {
      const index = folders.value.findIndex(f => f.id === selectedFolder.value!.id)
      if (index !== -1) {
        folders.value[index] = {
          ...folders.value[index],
          ...formData,
          updatedAt: new Date(),
        }
      }
      console.log(`✅ Folder updated: ${formData.name}`)
    } else {
      const newFolder: Folder = {
        id: formData.id,
        name: formData.name,
        parentId: formData.parentId,
        company: formData.company,
        description: formData.description,
        createdBy: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
        updatedBy: 'admin',
      }
      folders.value.push(newFolder)
      console.log(`✅ Folder created: ${formData.name}`)
    }

    showFolderModal.value = false
  } catch (error) {
    console.error('❌ Error saving folder:', error)
  } finally {
    loading.value = false
  }
}

const confirmDeleteFolder = async () => {
  if (!folderToDelete.value) return

  loading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 500))

    const index = folders.value.findIndex(f => f.id === folderToDelete.value!.id)
    if (index !== -1) {
      const deletedFolder = folders.value.splice(index, 1)[0]
      console.log(`✅ Folder deleted: ${deletedFolder.name}`)
    }

    showConfirmDialog.value = false
    folderToDelete.value = null
  } catch (error) {
    console.error('❌ Error deleting folder:', error)
  } finally {
    loading.value = false
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

onMounted(() => {
  console.log('📊 Loaded', folders.value.length, 'folders')
})
</script>

<template>
  <div class="admin-page">
    <AdminLayout>
      <template #sidebar>
        <AdminSidebar />
      </template>

      <div class="admin-content">
        <div class="page-header">
          <h1 class="page-title">จัดการโฟลเดอร์</h1>
          <button @click="handleAddFolder" class="btn btn--primary">
            ➕ เพิ่มโฟลเดอร์ใหม่
          </button>
        </div>

        <div class="filters-section">
          <div class="filters-row">
            <div class="filter-group">
              <input
                v-model="searchQuery"
                type="text"
                class="filter-input"
                placeholder="ค้นหาตามชื่อโฟลเดอร์..."
              />
            </div>

            <div class="filter-group">
              <select v-model="filterCompany" class="filter-select">
                <option :value="null">-- บริษัททั้งหมด --</option>
                <option v-for="c in mockCompanies" :key="c.code" :value="c.code">
                  {{ c.code }}
                </option>
              </select>
            </div>

            <button @click="clearFilters" class="btn btn--ghost">
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
    </AdminLayout>
  </div>
</template>

<style scoped>
.admin-page { min-height: 100vh; }
.admin-content { padding: var(--spacing-xl, 2rem) var(--spacing-lg, 1.25rem); max-width: 1400px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-xl, 2rem); gap: var(--spacing-md, 1rem); }
.page-title { margin: 0; font-size: 1.75rem; font-weight: 700; color: var(--color-text-primary, #1f2937); }
.btn { padding: var(--spacing-sm, 0.5rem) var(--spacing-lg, 1rem); border-radius: var(--radius-md, 0.375rem); font-size: 0.95rem; font-weight: 600; border: 1px solid transparent; cursor: pointer; transition: all var(--transition-base, 0.2s ease); }
.btn--primary { background-color: var(--color-primary, #3b82f6); color: white; }
.btn--primary:hover { background-color: #2563eb; box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1)); }
.btn--ghost { background-color: transparent; color: var(--color-text-secondary, #6b7280); border-color: var(--color-border-light, #e5e7eb); }
.btn--ghost:hover { background-color: var(--color-bg-secondary, #f3f4f6); color: var(--color-text-primary, #1f2937); }
.filters-section { background-color: var(--color-bg-primary, #ffffff); padding: var(--spacing-lg, 1.25rem); border-radius: var(--radius-lg, 0.5rem); margin-bottom: var(--spacing-lg, 1.25rem); box-shadow: var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05)); }
.filters-row { display: flex; gap: var(--spacing-md, 1rem); flex-wrap: wrap; margin-bottom: var(--spacing-md, 1rem); }
.filter-group { flex: 1; min-width: 200px; }
.filter-input, .filter-select { width: 100%; padding: var(--spacing-sm, 0.5rem) var(--spacing-md, 1rem); border: 1px solid var(--color-border-light, #e5e7eb); border-radius: var(--radius-md, 0.375rem); font-size: 0.95rem; background-color: var(--color-bg-primary, #ffffff); color: var(--color-text-primary, #1f2937); transition: all var(--transition-base, 0.2s ease); }
.filter-input:focus, .filter-select:focus { outline: none; border-color: var(--color-primary, #3b82f6); box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
.filter-info { display: flex; justify-content: space-between; align-items: center; font-size: 0.9rem; color: var(--color-text-secondary, #6b7280); }
.results-count { font-weight: 500; }
.table-section { background-color: var(--color-bg-primary, #ffffff); border-radius: var(--radius-lg, 0.5rem); box-shadow: var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05)); overflow: hidden; }
@media (max-width: 768px) { .admin-content { padding: var(--spacing-lg, 1.25rem) var(--spacing-md, 1rem); } .page-header { flex-direction: column; align-items: flex-start; } .filters-row { flex-direction: column; } .filter-group { min-width: auto; } }
</style>
