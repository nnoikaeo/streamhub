<script setup lang="ts">
import PageLayout from '~/components/compositions/PageLayout.vue'
/**
 * Admin Companies Management Page
 *
 * Features:
 * - Display all companies in DataTable
 * - CRUD operations
 * - Filter by active status
 * - Search by name or code
 * - Protected by admin middleware
 *
 * Route: /admin/companies
 * Middleware: auth, admin
 */

import { ref, computed, onMounted } from 'vue'
import type { Company } from '~/types/admin'
import { useAdminBreadcrumbs } from '~/composables/useAdminBreadcrumbs'
import { useAdminCompanies } from '~/composables/useAdminCompanies'
import { useAdminFolders } from '~/composables/useAdminFolders'

definePageMeta({
  middleware: ['auth', 'admin'],
  layout: 'default',
})

const { breadcrumbs } = useAdminBreadcrumbs()
const { companies, loading, fetchCompanies, updateCompany, deleteCompany } = useAdminCompanies()
const { folders } = useAdminFolders()

const showCompanyModal = ref(false)
const showConfirmDialog = ref(false)
const selectedCompany = ref<Company | null>(null)
const companyToDelete = ref<Company | null>(null)

const searchQuery = ref('')
const filterActive = ref<boolean | null>(null)

const columns = [
  { key: 'code', label: 'รหัส', sortable: true, width: '100px' },
  { key: 'name', label: 'ชื่อบริษัท', sortable: true, width: '300px' },
  { key: 'country', label: 'ประเทศ', sortable: true, width: '120px' },
  { key: 'isActive', label: 'สถานะ', sortable: true, width: '100px' },
]

const filteredCompanies = computed(() => {
  return companies.value.filter(company => {
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      if (!company.code.toLowerCase().includes(query) && !company.name.toLowerCase().includes(query)) {
        return false
      }
    }

    if (filterActive.value !== null && company.isActive !== filterActive.value) {
      return false
    }

    return true
  })
})

const handleAddCompany = () => {
  selectedCompany.value = null
  showCompanyModal.value = true
}

const handleEditCompany = (company: Company) => {
  selectedCompany.value = company
  showCompanyModal.value = true
}

const handleDeleteCompany = (company: Company) => {
  companyToDelete.value = company
  showConfirmDialog.value = true
}

const handleToggleActive = async (company: Company) => {
  try {
    await updateCompany(company.code, { isActive: !company.isActive })
  } catch (error) {
    console.error('Error toggling company status:', error)
  }
}

const handleSaveCompany = async (formData: any) => {
  try {
    if (selectedCompany.value) {
      await updateCompany(selectedCompany.value.code, formData)
    } else {
      // Note: createCompany is not shown in current code, but would be called here
      console.warn('Create company not yet implemented')
    }
    showCompanyModal.value = false
  } catch (error) {
    console.error('Error saving company:', error)
  }
}

const confirmDeleteCompany = async () => {
  if (!companyToDelete.value) return
  try {
    await deleteCompany(companyToDelete.value.code)
    showConfirmDialog.value = false
    companyToDelete.value = null
  } catch (error) {
    console.error('Error deleting company:', error)
  }
}

const clearFilters = () => {
  searchQuery.value = ''
  filterActive.value = null
}

const actions = [
  { label: 'แก้ไข', icon: '✏️', onClick: handleEditCompany, variant: 'primary' as const },
  { label: 'ลบ', icon: '🗑️', onClick: handleDeleteCompany, variant: 'danger' as const },
]

onMounted(async () => {
  try {
    await fetchCompanies()
  } catch (error) {
    console.error('Error loading companies:', error)
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
        <div class="page-header">
          <h1 class="page-header__title">จัดการบริษัท</h1>
          <button @click="handleAddCompany" class="page-header-action-btn">
            ➕ เพิ่มบริษัทใหม่
          </button>
        </div>

        <div class="filters-section">
          <div class="filters-row">
            <div class="filter-group">
              <input
                v-model="searchQuery"
                type="text"
                class="theme-form-input"
                placeholder="ค้นหาตามรหัสหรือชื่อบริษัท..."
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
          </div>

          <div class="filter-info">
            <span class="results-count">
              แสดง {{ filteredCompanies.length }} จาก {{ companies.length }} บริษัท
            </span>
          </div>
        </div>

        <div class="table-section">
          <DataTable
            :columns="columns"
            :data="filteredCompanies"
            :loading="loading"
            :actions="actions"
            empty-message="ไม่พบบริษัท"
          />
        </div>

        <FormModal
          v-model="showCompanyModal"
          :title="selectedCompany ? 'แก้ไขบริษัท' : 'เพิ่มบริษัทใหม่'"
          :loading="loading"
          @save="handleSaveCompany"
          @cancel="showCompanyModal = false"
        >
          <CompanyForm :company="selectedCompany" @submit="handleSaveCompany" />
        </FormModal>

        <ConfirmDialog
          :is-open="showConfirmDialog"
          title="ลบบริษัท"
          :message="`คุณแน่ใจว่าต้องการลบบริษัท '${companyToDelete?.code}' หรือไม่?`"
          :loading="loading"
          @confirm="confirmDeleteCompany"
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
