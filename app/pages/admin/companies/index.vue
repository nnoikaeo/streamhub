<script setup lang="ts">
import PageLayout from '~/components/compositions/PageLayout.vue'
/**
 * Admin Companies Management Page
 *
 * Features:
 * - Display all companies in DataTable
 * - CRUD operations (Create, Read, Update, Delete)
 * - Toggle active status inline via DataTable toggle switch
 * - Filter by active status and region
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
import { useAdminRegions } from '~/composables/useAdminRegions'
import { useAdminFolders } from '~/composables/useAdminFolders'

definePageMeta({
  middleware: ['auth', 'admin'],
  layout: 'default',
})

console.log('📄 [admin/companies/index.vue] Companies management page initialized')

const { breadcrumbs } = useAdminBreadcrumbs()
const { companies, loading, fetchCompanies, createCompany, updateCompany, deleteCompany } = useAdminCompanies()
const { regions, fetchRegions } = useAdminRegions()
const { folders, buildFolderTree } = useAdminFolders()

// Modal & dialog state
const showCompanyModal = ref(false)
const showConfirmDialog = ref(false)
const showToggleDialog = ref(false)
const selectedCompany = ref<Company | null>(null)
const companyToDelete = ref<Company | null>(null)
const companyToToggle = ref<Company | null>(null)

// Ref to CompanyForm — triggers its internal useForm validation + submission via defineExpose
const companyFormRef = ref<{ submit: () => Promise<void> } | null>(null)

// Filters
const searchQuery = ref('')
const filterActive = ref<boolean | null>(null)
const filterRegion = ref<string | null>(null)

/**
 * Region code → name map for display
 */
const regionMap = computed(() => {
  const map: Record<string, string> = {}
  for (const r of regions.value) {
    map[r.code] = r.name
  }
  return map
})

/**
 * Region code → sortOrder map for sorting
 */
const regionSortMap = computed(() => {
  const map: Record<string, number> = {}
  for (const r of regions.value) {
    map[r.code] = r.sortOrder ?? 999
  }
  return map
})

/**
 * Column definitions for DataTable
 */
const columns = [
  { key: 'sortOrder', label: 'ลำดับ', sortable: true, width: '80px', align: 'center' as const },
  { key: 'code', label: 'รหัส', sortable: true, width: '100px' },
  { key: 'name', label: 'ชื่อบริษัท', sortable: true, width: '300px', subtitleKey: 'description' },
  { key: 'regionName', label: 'กลุ่มธุรกิจ/เขตพื้นที่', sortable: true, width: '200px' },
  { key: 'isActive', label: 'สถานะ', sortable: true, width: '100px', isStatusColumn: true },
]

/**
 * Filter, search, and enrich companies with region name
 */
const filteredCompanies = computed(() => {
  return companies.value
    .filter(company => {
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        const matchesCode = company.code.toLowerCase().includes(query)
        const matchesName = company.name.toLowerCase().includes(query)
        const matchesDescription = company.description?.toLowerCase().includes(query) ?? false
        if (!matchesCode && !matchesName && !matchesDescription) {
          return false
        }
      }

      if (filterActive.value !== null && company.isActive !== filterActive.value) {
        return false
      }

      if (filterRegion.value !== null && (company.region ?? '') !== filterRegion.value) {
        return false
      }

      return true
    })
    .map(company => ({
      ...company,
      regionName: company.region
        ? `${regionMap.value[company.region] ?? company.region}${company.regionRole === 'hub' ? ' (Hub)' : company.regionRole === 'sub' ? ' (Sub)' : ''}`
        : '—',
    }))
    .sort((a, b) => {
      // Ungrouped companies first, then by region sortOrder
      const regionA = a.region ?? ''
      const regionB = b.region ?? ''
      if (!regionA && regionB) return -1
      if (regionA && !regionB) return 1
      if (regionA !== regionB) {
        return (regionSortMap.value[regionA] ?? 999) - (regionSortMap.value[regionB] ?? 999)
      }
      // Within same region, sort by sortOrder
      return (a.sortOrder ?? 999) - (b.sortOrder ?? 999)
    })
})

/**
 * Reorder handlers — swap sortOrder with adjacent item within the same region
 */
const handleMoveUp = async (company: Company) => {
  const sameGroup = filteredCompanies.value.filter(c => (c.region ?? '') === (company.region ?? ''))
  const index = sameGroup.findIndex(c => c.code === company.code)
  if (index <= 0) return

  const prev = sameGroup[index - 1]
  if (!prev) return
  const currentOrder = company.sortOrder ?? index + 1
  const prevOrder = prev.sortOrder ?? index

  await updateCompany(company.code, { sortOrder: prevOrder })
  await updateCompany(prev.code, { sortOrder: currentOrder })
}

const handleMoveDown = async (company: Company) => {
  const sameGroup = filteredCompanies.value.filter(c => (c.region ?? '') === (company.region ?? ''))
  const index = sameGroup.findIndex(c => c.code === company.code)
  if (index < 0 || index >= sameGroup.length - 1) return

  const next = sameGroup[index + 1]
  if (!next) return
  const currentOrder = company.sortOrder ?? index + 1
  const nextOrder = next.sortOrder ?? index + 2

  await updateCompany(company.code, { sortOrder: nextOrder })
  await updateCompany(next.code, { sortOrder: currentOrder })
}

/**
 * Action handlers
 */
const handleAddCompany = () => {
  console.log('➕ [Action] Add new company')
  selectedCompany.value = null
  showCompanyModal.value = true
}

const handleEditCompany = (company: Company) => {
  console.log('✏️ [Action] Edit company:', company.code)
  selectedCompany.value = company
  showCompanyModal.value = true
}

const handleDeleteCompany = (company: Company) => {
  console.log('🗑️ [Action] Delete company:', company.code)
  companyToDelete.value = company
  showConfirmDialog.value = true
}

const handleToggleActive = (company: Company) => {
  console.log(`🔄 [Action] Toggle active for company: ${company.code} (current: ${company.isActive})`)
  companyToToggle.value = company
  showToggleDialog.value = true
}

const confirmToggleActive = async () => {
  if (!companyToToggle.value) return
  try {
    const newStatus = !companyToToggle.value.isActive
    console.log(`🔄 [Toggle] Updating company ${companyToToggle.value.code} isActive → ${newStatus}`)
    await updateCompany(companyToToggle.value.code, { isActive: newStatus })
    console.log(`✅ [Toggle] Company ${companyToToggle.value.code} status updated to ${newStatus}`)
    showToggleDialog.value = false
    companyToToggle.value = null
  } catch (error) {
    console.error('❌ [Toggle] Error updating company status:', error)
  }
}

const handleSaveCompany = async (formData: Partial<Company>) => {
  try {
    console.log('💾 [Save] Saving company data:', formData)
    if (selectedCompany.value) {
      console.log(`📤 [Save] Updating company: ${selectedCompany.value.code}`)
      await updateCompany(selectedCompany.value.code, formData)
      console.log(`✅ [Save] Company updated: ${selectedCompany.value.code}`)
    } else {
      console.log('➕ [Save] Creating new company:', formData.code)
      await createCompany(formData)
      console.log(`✅ [Save] Company created: ${formData.code}`)
    }
    showCompanyModal.value = false
    console.log('🔚 [Save] Modal closed')
  } catch (error) {
    console.error('❌ [Save] Error saving company:', error)
  }
}

const confirmDeleteCompany = async () => {
  if (!companyToDelete.value) {
    console.warn('⚠️ [Delete] No company selected for deletion')
    return
  }
  try {
    console.log(`🗑️ [Delete] Deleting company: ${companyToDelete.value.code}`)
    await deleteCompany(companyToDelete.value.code)
    console.log(`✅ [Delete] Company deleted: ${companyToDelete.value.code}`)
    showConfirmDialog.value = false
    companyToDelete.value = null
    console.log('🔚 [Delete] Dialog closed')
  } catch (error) {
    console.error('❌ [Delete] Error deleting company:', error)
  }
}

const clearFilters = () => {
  console.log('🔄 [Filters] Clearing all filters')
  searchQuery.value = ''
  filterActive.value = null
  filterRegion.value = null
  console.log('✅ [Filters] All filters cleared')
}

/**
 * Action buttons for table rows
 */
const actions = [
  {
    label: 'เลื่อนขึ้น',
    icon: '⬆️',
    onClick: handleMoveUp,
    variant: 'ghost' as const,
  },
  {
    label: 'เลื่อนลง',
    icon: '⬇️',
    onClick: handleMoveDown,
    variant: 'ghost' as const,
  },
  {
    label: 'แก้ไข',
    icon: '✏️',
    onClick: handleEditCompany,
    variant: 'primary' as const,
  },
  {
    label: 'ลบ',
    icon: '🗑️',
    onClick: handleDeleteCompany,
    variant: 'danger' as const,
  },
]

onMounted(async () => {
  try {
    console.log('🚀 [Lifecycle] onMounted - Starting to fetch companies and regions...')
    await Promise.all([fetchCompanies(), fetchRegions()])
    console.log('✅ [Lifecycle] onMounted - Companies and regions fetched successfully')
  } catch (error) {
    console.error('❌ [Lifecycle] Error loading data:', error)
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
    <!-- Main Content -->
    <AdminPageContent>
      <template #header>
        <h1 class="page-header__title">จัดการบริษัท</h1>
        <button @click="handleAddCompany" class="page-header-action-btn">
          ➕ เพิ่มบริษัทใหม่
        </button>
      </template>

      <template #filters>
        <!-- Search -->
        <div class="filter-group">
          <input
            v-model="searchQuery"
            type="text"
            class="theme-form-input"
            placeholder="ค้นหาตามรหัสหรือชื่อบริษัท..."
          />
        </div>

        <!-- Active Status Filter -->
        <div class="filter-group">
          <select v-model="filterActive" class="theme-form-select">
            <option :value="null">-- สถานะทั้งหมด --</option>
            <option :value="true">เปิดใช้งาน</option>
            <option :value="false">ปิดใช้งาน</option>
          </select>
        </div>

        <!-- Region Filter -->
        <div class="filter-group">
          <select v-model="filterRegion" class="theme-form-select">
            <option :value="null">-- กลุ่มธุรกิจ/เขตพื้นที่ทั้งหมด --</option>
            <option value="">ไม่มีกลุ่มธุรกิจ/เขตพื้นที่</option>
            <option v-for="r in regions" :key="r.code" :value="r.code">{{ r.name }}</option>
          </select>
        </div>

        <!-- Clear Filters -->
        <button @click="clearFilters" class="theme-btn theme-btn--ghost">
          🔄 ล้างตัวกรอง
        </button>
      </template>

      <template #table>
        <DataTable
          :columns="columns"
          :data="filteredCompanies"
          :loading="loading"
          :actions="actions"
          empty-message="ไม่พบบริษัท"
          @toggleActive="handleToggleActive"
        />
      </template>

      <!-- Company Form Modal -->
      <FormModal
        v-model="showCompanyModal"
        :title="selectedCompany ? 'แก้ไขบริษัท' : 'เพิ่มบริษัทใหม่'"
        :loading="loading"
        @save="companyFormRef?.submit()"
        @cancel="showCompanyModal = false"
      >
        <CompanyForm ref="companyFormRef" :company="selectedCompany" :regions="regions" :companies="companies" @submit="handleSaveCompany" />
      </FormModal>

      <!-- Delete Confirmation Dialog -->
      <ConfirmDialog
        :is-open="showConfirmDialog"
        title="ลบบริษัท"
        :message="`คุณแน่ใจว่าต้องการลบบริษัท '${companyToDelete?.name}' (${companyToDelete?.code}) หรือไม่?`"
        :loading="loading"
        @confirm="confirmDeleteCompany"
        @cancel="showConfirmDialog = false"
      />

      <!-- Toggle Active Confirmation Dialog -->
      <ConfirmDialog
        :is-open="showToggleDialog"
        :title="companyToToggle?.isActive ? 'ปิดใช้งานบริษัท' : 'เปิดใช้งานบริษัท'"
        :message="companyToToggle?.isActive
          ? `คุณต้องการปิดใช้งานบริษัท '${companyToToggle?.name}' (${companyToToggle?.code}) หรือไม่?`
          : `คุณต้องการเปิดใช้งานบริษัท '${companyToToggle?.name}' (${companyToToggle?.code}) หรือไม่?`"
        :confirm-text="companyToToggle?.isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน'"
        :is-danger="companyToToggle?.isActive"
        :loading="loading"
        @confirm="confirmToggleActive"
        @cancel="showToggleDialog = false; companyToToggle = null"
      />
    </AdminPageContent>
  </PageLayout>
</template>
