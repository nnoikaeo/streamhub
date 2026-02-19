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
import type { Company } from '~/composables/useMockData'
import { mockCompanies, mockFolders } from '~/composables/useMockData'
import { useAdminBreadcrumbs } from '~/composables/useAdminBreadcrumbs'

definePageMeta({
  middleware: ['auth', 'admin'],
  layout: 'default',
})

const { breadcrumbs } = useAdminBreadcrumbs()

const companies = ref<Company[]>([...mockCompanies])
const loading = ref(false)
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
  loading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 300))
    const index = companies.value.findIndex(c => c.code === company.code)
    if (index !== -1) {
      companies.value[index].isActive = !companies.value[index].isActive
    }
  } finally {
    loading.value = false
  }
}

const handleSaveCompany = async (formData: any) => {
  loading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 500))

    if (selectedCompany.value) {
      const index = companies.value.findIndex(c => c.code === selectedCompany.value!.code)
      if (index !== -1) {
        companies.value[index] = { ...companies.value[index], ...formData }
      }
    } else {
      companies.value.push(formData)
    }

    showCompanyModal.value = false
  } finally {
    loading.value = false
  }
}

const confirmDeleteCompany = async () => {
  if (!companyToDelete.value) return
  loading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 500))
    const index = companies.value.findIndex(c => c.code === companyToDelete.value!.code)
    if (index !== -1) {
      companies.value.splice(index, 1)
    }
    showConfirmDialog.value = false
    companyToDelete.value = null
  } finally {
    loading.value = false
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

onMounted(() => {
  console.log('📊 Loaded', companies.value.length, 'companies')
})
</script>

<template>
  <PageLayout
    :folders="mockFolders"
    :allow-search="true"
    :allow-create="false"
    :breadcrumbs="breadcrumbs"
  >
    <div class="admin-content">
        <div class="page-header">
          <h1 class="page-title">จัดการบริษัท</h1>
          <button @click="handleAddCompany" class="btn btn--primary">
            ➕ เพิ่มบริษัทใหม่
          </button>
        </div>

        <div class="filters-section">
          <div class="filters-row">
            <div class="filter-group">
              <input
                v-model="searchQuery"
                type="text"
                class="filter-input"
                placeholder="ค้นหาตามรหัสหรือชื่อบริษัท..."
              />
            </div>

            <div class="filter-group">
              <select v-model="filterActive" class="filter-select">
                <option :value="null">-- สถานะทั้งหมด --</option>
                <option :value="true">เปิดใช้งาน</option>
                <option :value="false">ปิดใช้งาน</option>
              </select>
            </div>

            <button @click="clearFilters" class="btn btn--ghost">
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
