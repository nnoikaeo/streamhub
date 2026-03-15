<script setup lang="ts">
import PageLayout from '~/components/compositions/PageLayout.vue'
/**
 * Admin Regions Management Page
 *
 * Features:
 * - Display all regions in DataTable
 * - CRUD operations (Create, Read, Update, Delete)
 * - Toggle active status inline via DataTable toggle switch
 * - Filter by active status
 * - Search by name or code
 * - Protected by admin middleware
 *
 * Route: /admin/regions
 * Middleware: auth, admin
 */

import { ref, computed, onMounted } from 'vue'
import type { Region } from '~/types/admin'
import { useAdminBreadcrumbs } from '~/composables/useAdminBreadcrumbs'
import { useAdminRegions } from '~/composables/useAdminRegions'
import { useAdminFolders } from '~/composables/useAdminFolders'

definePageMeta({
  middleware: ['auth', 'admin'],
  layout: 'default',
})

console.log('📄 [admin/regions/index.vue] Regions management page initialized')

const { breadcrumbs } = useAdminBreadcrumbs()
const { regions, loading, fetchRegions, createRegion, updateRegion, deleteRegion } = useAdminRegions()
const { folders, buildFolderTree } = useAdminFolders()

// Modal & dialog state
const showRegionModal = ref(false)
const showConfirmDialog = ref(false)
const showToggleDialog = ref(false)
const selectedRegion = ref<Region | null>(null)
const regionToDelete = ref<Region | null>(null)
const regionToToggle = ref<Region | null>(null)

// Ref to RegionForm
const regionFormRef = ref<{ submit: () => Promise<void> } | null>(null)

// Filters
const searchQuery = ref('')
const filterActive = ref<boolean | null>(null)

/**
 * Column definitions for DataTable
 */
const columns = [
  { key: 'sortOrder', label: 'ลำดับ', sortable: true, width: '80px', align: 'center' as const },
  { key: 'code', label: 'รหัส', sortable: true, width: '120px' },
  { key: 'name', label: 'ชื่อกลุ่มธุรกิจ/เขตพื้นที่', sortable: true, width: '300px', subtitleKey: 'description' },
  { key: 'isActive', label: 'สถานะ', sortable: true, width: '100px', isStatusColumn: true },
]

/**
 * Filter and search regions
 */
const filteredRegions = computed(() => {
  return regions.value
    .filter(region => {
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        const matchesCode = region.code.toLowerCase().includes(query)
        const matchesName = region.name.toLowerCase().includes(query)
        const matchesDescription = region.description?.toLowerCase().includes(query) ?? false
        if (!matchesCode && !matchesName && !matchesDescription) {
          return false
        }
      }

      if (filterActive.value !== null && region.isActive !== filterActive.value) {
        return false
      }

      return true
    })
    .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999))
})

/**
 * Reorder handlers — swap sortOrder with adjacent item
 */
const handleMoveUp = async (region: Region) => {
  const sorted = filteredRegions.value
  const index = sorted.findIndex(r => r.code === region.code)
  if (index <= 0) return

  const prev = sorted[index - 1]
  const currentOrder = region.sortOrder ?? index + 1
  const prevOrder = prev.sortOrder ?? index

  await updateRegion(region.code, { sortOrder: prevOrder })
  await updateRegion(prev.code, { sortOrder: currentOrder })
}

const handleMoveDown = async (region: Region) => {
  const sorted = filteredRegions.value
  const index = sorted.findIndex(r => r.code === region.code)
  if (index < 0 || index >= sorted.length - 1) return

  const next = sorted[index + 1]
  const currentOrder = region.sortOrder ?? index + 1
  const nextOrder = next.sortOrder ?? index + 2

  await updateRegion(region.code, { sortOrder: nextOrder })
  await updateRegion(next.code, { sortOrder: currentOrder })
}

/**
 * Action handlers
 */
const handleAddRegion = () => {
  console.log('➕ [Action] Add new region')
  selectedRegion.value = null
  showRegionModal.value = true
}

const handleEditRegion = (region: Region) => {
  console.log('✏️ [Action] Edit region:', region.code)
  selectedRegion.value = region
  showRegionModal.value = true
}

const handleDeleteRegion = (region: Region) => {
  console.log('🗑️ [Action] Delete region:', region.code)
  regionToDelete.value = region
  showConfirmDialog.value = true
}

const handleToggleActive = (region: Region) => {
  console.log(`🔄 [Action] Toggle active for region: ${region.code} (current: ${region.isActive})`)
  regionToToggle.value = region
  showToggleDialog.value = true
}

const confirmToggleActive = async () => {
  if (!regionToToggle.value) return
  try {
    const newStatus = !regionToToggle.value.isActive
    console.log(`🔄 [Toggle] Updating region ${regionToToggle.value.code} isActive → ${newStatus}`)
    await updateRegion(regionToToggle.value.code, { isActive: newStatus })
    console.log(`✅ [Toggle] Region ${regionToToggle.value.code} status updated to ${newStatus}`)
    showToggleDialog.value = false
    regionToToggle.value = null
  } catch (error) {
    console.error('❌ [Toggle] Error updating region status:', error)
  }
}

const handleSaveRegion = async (formData: Partial<Region>) => {
  try {
    console.log('💾 [Save] Saving region data:', formData)
    if (selectedRegion.value) {
      console.log(`📤 [Save] Updating region: ${selectedRegion.value.code}`)
      await updateRegion(selectedRegion.value.code, formData)
      console.log(`✅ [Save] Region updated: ${selectedRegion.value.code}`)
    } else {
      console.log('➕ [Save] Creating new region:', formData.code)
      await createRegion(formData)
      console.log(`✅ [Save] Region created: ${formData.code}`)
    }
    showRegionModal.value = false
    console.log('🔚 [Save] Modal closed')
  } catch (error) {
    console.error('❌ [Save] Error saving region:', error)
  }
}

const confirmDeleteRegion = async () => {
  if (!regionToDelete.value) {
    console.warn('⚠️ [Delete] No region selected for deletion')
    return
  }
  try {
    console.log(`🗑️ [Delete] Deleting region: ${regionToDelete.value.code}`)
    await deleteRegion(regionToDelete.value.code)
    console.log(`✅ [Delete] Region deleted: ${regionToDelete.value.code}`)
    showConfirmDialog.value = false
    regionToDelete.value = null
    console.log('🔚 [Delete] Dialog closed')
  } catch (error) {
    console.error('❌ [Delete] Error deleting region:', error)
  }
}

const clearFilters = () => {
  console.log('🔄 [Filters] Clearing all filters')
  searchQuery.value = ''
  filterActive.value = null
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
    onClick: handleEditRegion,
    variant: 'primary' as const,
  },
  {
    label: 'ลบ',
    icon: '🗑️',
    onClick: handleDeleteRegion,
    variant: 'danger' as const,
  },
]

onMounted(async () => {
  try {
    console.log('🚀 [Lifecycle] onMounted - Starting to fetch regions...')
    await fetchRegions()
    console.log('✅ [Lifecycle] onMounted - Regions fetched successfully')
  } catch (error) {
    console.error('❌ [Lifecycle] Error loading regions:', error)
  }
})

/** sortOrder ถัดไปสำหรับ region ใหม่ */
const nextRegionSortOrder = computed(() =>
  regions.value.reduce((max, r) => Math.max(max, r.sortOrder ?? 0), 0) + 1
)

/**
 * Folder tree for sidebar
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
        <h1 class="page-header__title">จัดการกลุ่มธุรกิจ/เขตพื้นที่</h1>
        <button @click="handleAddRegion" class="page-header-action-btn">
          ➕ เพิ่มกลุ่มธุรกิจ/เขตพื้นที่ใหม่
        </button>
      </template>

      <template #filters>
        <!-- Search -->
        <div class="filter-group">
          <input
            v-model="searchQuery"
            type="text"
            class="theme-form-input"
            placeholder="ค้นหาตามรหัสหรือชื่อกลุ่มธุรกิจ/เขตพื้นที่..."
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

        <!-- Clear Filters -->
        <button @click="clearFilters" class="theme-btn theme-btn--ghost">
          🔄 ล้างตัวกรอง
        </button>
      </template>

      <template #table>
        <DataTable
          :columns="columns"
          :data="filteredRegions"
          :loading="loading"
          :actions="actions"
          empty-message="ไม่พบกลุ่มธุรกิจ/เขตพื้นที่"
          @toggleActive="handleToggleActive"
        />
      </template>

      <!-- Region Form Modal -->
      <FormModal
        v-model="showRegionModal"
        :title="selectedRegion ? 'แก้ไขกลุ่มธุรกิจ/เขตพื้นที่' : 'เพิ่มกลุ่มธุรกิจ/เขตพื้นที่ใหม่'"
        :loading="loading"
        @save="regionFormRef?.submit()"
        @cancel="showRegionModal = false"
      >
        <RegionForm ref="regionFormRef" :region="selectedRegion" :next-sort-order="nextRegionSortOrder" @submit="handleSaveRegion" />
      </FormModal>

      <!-- Delete Confirmation Dialog -->
      <ConfirmDialog
        :is-open="showConfirmDialog"
        title="ลบกลุ่มธุรกิจ/เขตพื้นที่"
        :message="`คุณแน่ใจว่าต้องการลบกลุ่มธุรกิจ/เขตพื้นที่ '${regionToDelete?.name}' (${regionToDelete?.code}) หรือไม่?`"
        :loading="loading"
        @confirm="confirmDeleteRegion"
        @cancel="showConfirmDialog = false"
      />

      <!-- Toggle Active Confirmation Dialog -->
      <ConfirmDialog
        :is-open="showToggleDialog"
        :title="regionToToggle?.isActive ? 'ปิดใช้งานกลุ่มธุรกิจ/เขตพื้นที่' : 'เปิดใช้งานกลุ่มธุรกิจ/เขตพื้นที่'"
        :message="regionToToggle?.isActive
          ? `คุณต้องการปิดใช้งานกลุ่มธุรกิจ/เขตพื้นที่ '${regionToToggle?.name}' (${regionToToggle?.code}) หรือไม่?`
          : `คุณต้องการเปิดใช้งานกลุ่มธุรกิจ/เขตพื้นที่ '${regionToToggle?.name}' (${regionToToggle?.code}) หรือไม่?`"
        :confirm-text="regionToToggle?.isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน'"
        :is-danger="regionToToggle?.isActive"
        :loading="loading"
        @confirm="confirmToggleActive"
        @cancel="showToggleDialog = false; regionToToggle = null"
      />
    </AdminPageContent>
  </PageLayout>
</template>
