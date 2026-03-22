<script setup lang="ts">
import PageLayout from '~/components/compositions/PageLayout.vue'
/**
 * Admin Groups Management Page
 *
 * Features:
 * - Display all groups in DataTable
 * - CRUD operations (Create, Read, Update, Delete)
 * - Toggle active status inline via DataTable toggle switch
 * - Filter by active status
 * - Search by name or ID
 * - Protected by admin middleware
 *
 * Route: /admin/groups
 * Middleware: auth, admin
 *
 * WORKFLOW:
 * 1. Page loads → auth & admin middleware checks
 * 2. onMounted → fetchGroups() loads all groups from useAdminGroups composable
 * 3. DataTable renders groups with columns (id, name+description, membersCount, isActive toggle)
 * 4. User actions:
 *    - Click "เพิ่มกลุ่มใหม่" → handleAddGroup → showGroupModal
 *    - Click "ดูข้อมูล" → handleViewGroup → showViewModal with viewingGroup
 *    - Click "แก้ไข" → handleEditGroup → showGroupModal with selectedGroup
 *    - Click "ลบ" → handleDeleteGroup → showConfirmDialog with groupToDelete
 *    - Toggle status → handleToggleActive → updateGroup API call
 * 5. FormModal with GroupForm → groupFormRef.submit() → validates → handleSaveGroup
 * 6. ConfirmDialog (delete) → confirmDeleteGroup → deleteGroup API call
 * 7. ConfirmDialog (toggle) → confirmToggleActive → updateGroup API call
 * 8. GroupViewModal → read-only view of group info + resolved member list
 *
 * COMPONENTS USED:
 * - AdminPageContent: Shared layout wrapper (header, filters, table structure + styles)
 * - DataTable: Generic table component
 * - FormModal: Modal wrapper for group form
 * - GroupForm: Form component for editing group data
 * - GroupViewModal: Read-only modal for viewing group details + members
 * - ConfirmDialog: Confirmation dialog for delete and toggle actions
 *
 * COMPOSABLES USED:
 * - useAdminGroups: Fetch, create, update, delete groups
 * - useAdminFolders: Fetch folders for sidebar + buildFolderTree
 * - useAdminBreadcrumbs: Generate breadcrumb navigation
 */

import { ref, computed, onMounted } from 'vue'
import type { AdminGroup } from '~/types/admin'
import { useAdminBreadcrumbs } from '~/composables/useAdminBreadcrumbs'
import { useAdminGroups } from '~/composables/useAdminGroups'
import { useAdminFolders } from '~/composables/useAdminFolders'
import { useAdminCrudPage } from '~/composables/useAdminCrudPage'

definePageMeta({
  middleware: ['auth', 'admin'],
  layout: 'default',
})

console.log('📄 [admin/groups/index.vue] Groups management page initialized')

const { breadcrumbs } = useAdminBreadcrumbs()
const { groups, loading, fetchGroups, createGroup, updateGroup, deleteGroup } = useAdminGroups()
const { folders, buildFolderTree } = useAdminFolders()

// CRUD page state (modal, dialog, handlers)
const {
  showFormModal: showGroupModal,
  showConfirmDialog,
  showToggleDialog,
  selectedItem: selectedGroup,
  itemToDelete: groupToDelete,
  itemToToggle: groupToToggle,
  formRef: groupFormRef,
  handleAdd: handleAddGroup,
  handleEdit: handleEditGroup,
  handleDelete: handleDeleteGroup,
  handleToggleActive,
  confirmToggleActive,
  handleSave: handleSaveGroup,
  confirmDelete: confirmDeleteGroup,
} = useAdminCrudPage<AdminGroup>({
  idKey: 'id',
  displayKey: 'name',
  createFn: createGroup,
  updateFn: updateGroup,
  deleteFn: deleteGroup,
  resourceLabel: 'กลุ่ม',
})

// Page-specific: view modal
const showViewModal = ref(false)
const viewingGroup = ref<AdminGroup | null>(null)

// Filters
const searchQuery = ref('')
const filterActive = ref<boolean | null>(null)

/**
 * Column definitions for DataTable
 * - ID: group code identifier
 * - Name: group name with description as subtitle
 * - Members count
 * - Status toggle switch (green when enabled, uses isStatusColumn)
 * - Actions (icons only)
 */
const columns = [
  { key: 'sortOrder', label: 'ลำดับ', sortable: true, width: '80px', align: 'center' as const },
  { key: 'id', label: 'รหัสกลุ่ม', sortable: true, width: '150px' },
  { key: 'name', label: 'ชื่อกลุ่ม', sortable: true, width: '280px', subtitleKey: 'description' },
  { key: 'membersCount', label: 'สมาชิก', width: '100px' },
  { key: 'isActive', label: 'สถานะ', sortable: true, width: '100px', isStatusColumn: true },
]

/**
 * Filter and search groups
 */
const filteredGroups = computed(() => {
  return groups.value
    .filter(group => {
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        const matchesId = group.id.toLowerCase().includes(query)
        const matchesName = group.name.toLowerCase().includes(query)
        if (!matchesId && !matchesName) return false
      }

      if (filterActive.value !== null && group.isActive !== filterActive.value) {
        return false
      }

      return true
    })
    .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999))
})

/**
 * Add membersCount field for DataTable display
 */
const displayGroups = computed(() =>
  filteredGroups.value.map(group => ({
    ...group,
    membersCount: group.members?.length ?? 0,
  }))
)

/**
 * Action handlers (page-specific: view)
 */
const handleViewGroup = (group: AdminGroup) => {
  viewingGroup.value = group
  showViewModal.value = true
}

/**
 * Reorder handlers — swap sortOrder with adjacent item
 */
const handleMoveUp = async (group: AdminGroup) => {
  const sorted = filteredGroups.value
  const index = sorted.findIndex(g => g.id === group.id)
  if (index <= 0) return
  const prev = sorted[index - 1]
  const currentOrder = group.sortOrder ?? index + 1
  const prevOrder = prev.sortOrder ?? index
  await updateGroup(group.id, { sortOrder: prevOrder })
  await updateGroup(prev.id, { sortOrder: currentOrder })
  await fetchGroups()
}

const handleMoveDown = async (group: AdminGroup) => {
  const sorted = filteredGroups.value
  const index = sorted.findIndex(g => g.id === group.id)
  if (index < 0 || index >= sorted.length - 1) return
  const next = sorted[index + 1]
  const currentOrder = group.sortOrder ?? index + 1
  const nextOrder = next.sortOrder ?? index + 2
  await updateGroup(group.id, { sortOrder: nextOrder })
  await updateGroup(next.id, { sortOrder: currentOrder })
  await fetchGroups()
}

const clearFilters = () => {
  searchQuery.value = ''
  filterActive.value = null
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
    label: 'ดูข้อมูล',
    icon: '👁️',
    onClick: handleViewGroup,
    variant: 'secondary' as const,
  },
  {
    label: 'แก้ไข',
    icon: '✏️',
    onClick: handleEditGroup,
    variant: 'primary' as const,
  },
  {
    label: 'ลบ',
    icon: '🗑️',
    onClick: handleDeleteGroup,
    variant: 'danger' as const,
  },
]

onMounted(async () => {
  try {
    console.log('🚀 [Lifecycle] onMounted - Starting to fetch groups...')
    await fetchGroups()
    console.log('✅ [Lifecycle] onMounted - Groups fetched successfully')
  } catch (error) {
    console.error('❌ [Lifecycle] Error loading groups:', error)
  }
})

/**
 * Folder tree for sidebar — built via shared buildFolderTree from useAdminFolders
 */
const folderTree = computed(() => buildFolderTree(folders.value))

/** sortOrder ถัดไปสำหรับ group ใหม่ */
const nextGroupSortOrder = computed(() =>
  groups.value.reduce((max, g) => Math.max(max, g.sortOrder ?? 0), 0) + 1
)
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
        <h1 class="page-header__title">จัดการกลุ่ม</h1>
        <button @click="handleAddGroup" class="page-header-action-btn">
          ➕ เพิ่มกลุ่มใหม่
        </button>
      </template>

      <template #filters>
        <div class="filter-group">
          <input
            v-model="searchQuery"
            type="text"
            class="theme-form-input"
            placeholder="ค้นหาตามชื่อหรือรหัสกลุ่ม..."
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
          :data="displayGroups"
          :loading="loading"
          :actions="actions"
          empty-message="ไม่พบกลุ่ม"
          @toggleActive="handleToggleActive"
        />
      </template>

      <!-- Group Form Modal -->
      <FormModal
        v-model="showGroupModal"
        :title="selectedGroup ? 'แก้ไขกลุ่ม' : 'เพิ่มกลุ่มใหม่'"
        size="xl"
        :loading="loading"
        @save="groupFormRef?.submit()"
        @cancel="showGroupModal = false"
      >
        <GroupForm ref="groupFormRef" :group="selectedGroup" :next-sort-order="nextGroupSortOrder" @submit="handleSaveGroup" />
      </FormModal>

      <!-- Delete Confirmation Dialog -->
      <ConfirmDialog
        :is-open="showConfirmDialog"
        title="ลบกลุ่ม"
        :message="`คุณแน่ใจว่าต้องการลบกลุ่ม '${groupToDelete?.name}' หรือไม่?`"
        :loading="loading"
        @confirm="confirmDeleteGroup"
        @cancel="showConfirmDialog = false"
      />

      <!-- Toggle Active Confirmation Dialog -->
      <ConfirmDialog
        :is-open="showToggleDialog"
        :title="groupToToggle?.isActive ? 'ปิดใช้งานกลุ่ม' : 'เปิดใช้งานกลุ่ม'"
        :message="groupToToggle?.isActive
          ? `คุณต้องการปิดใช้งานกลุ่ม '${groupToToggle?.name}' หรือไม่?`
          : `คุณต้องการเปิดใช้งานกลุ่ม '${groupToToggle?.name}' หรือไม่?`"
        :confirm-text="groupToToggle?.isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน'"
        :is-danger="groupToToggle?.isActive"
        :loading="loading"
        @confirm="confirmToggleActive"
        @cancel="showToggleDialog = false; groupToToggle = null"
      />

      <!-- View Group Modal -->
      <GroupViewModal
        v-model="showViewModal"
        :group="viewingGroup"
      />
    </AdminPageContent>
  </PageLayout>
</template>
