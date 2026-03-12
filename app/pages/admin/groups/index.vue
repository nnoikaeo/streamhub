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

definePageMeta({
  middleware: ['auth', 'admin'],
  layout: 'default',
})

console.log('📄 [admin/groups/index.vue] Groups management page initialized')

const { breadcrumbs } = useAdminBreadcrumbs()
const { groups, loading, fetchGroups, createGroup, updateGroup, deleteGroup } = useAdminGroups()
const { folders, buildFolderTree } = useAdminFolders()

// Modal & dialog state
const showGroupModal = ref(false)
const showViewModal = ref(false)
const showConfirmDialog = ref(false)
const showToggleDialog = ref(false)
const selectedGroup = ref<AdminGroup | null>(null)
const viewingGroup = ref<AdminGroup | null>(null)
const groupToDelete = ref<AdminGroup | null>(null)
const groupToToggle = ref<AdminGroup | null>(null)

// Ref to GroupForm — triggers its internal useForm validation + submission via defineExpose
const groupFormRef = ref<{ submit: () => Promise<void> } | null>(null)

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
  { key: 'id', label: 'รหัสกลุ่ม', sortable: true, width: '150px' },
  { key: 'name', label: 'ชื่อกลุ่ม', sortable: true, width: '280px', subtitleKey: 'description' },
  { key: 'membersCount', label: 'สมาชิก', width: '100px' },
  { key: 'isActive', label: 'สถานะ', sortable: true, width: '100px', isStatusColumn: true },
]

/**
 * Filter and search groups
 */
const filteredGroups = computed(() => {
  return groups.value.filter(group => {
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
 * Action handlers
 */
const handleAddGroup = () => {
  console.log('➕ [Action] Add new group')
  selectedGroup.value = null
  showGroupModal.value = true
}

const handleViewGroup = (group: AdminGroup) => {
  console.log('👁️ [Action] View group:', group.id)
  viewingGroup.value = group
  showViewModal.value = true
}

const handleEditGroup = (group: AdminGroup) => {
  console.log('✏️ [Action] Edit group:', group.id)
  selectedGroup.value = group
  showGroupModal.value = true
}

const handleDeleteGroup = (group: AdminGroup) => {
  console.log('🗑️ [Action] Delete group:', group.id)
  groupToDelete.value = group
  showConfirmDialog.value = true
}

const handleToggleActive = (group: AdminGroup) => {
  console.log(`🔄 [Action] Toggle active for group: ${group.id} (current: ${group.isActive})`)
  groupToToggle.value = group
  showToggleDialog.value = true
}

const confirmToggleActive = async () => {
  if (!groupToToggle.value) return
  try {
    const newStatus = !groupToToggle.value.isActive
    console.log(`🔄 [Toggle] Updating group ${groupToToggle.value.id} isActive → ${newStatus}`)
    await updateGroup(groupToToggle.value.id, { isActive: newStatus })
    console.log(`✅ [Toggle] Group ${groupToToggle.value.name} status updated to ${newStatus}`)
    showToggleDialog.value = false
    groupToToggle.value = null
  } catch (error) {
    console.error('❌ [Toggle] Error updating group status:', error)
  }
}

const handleSaveGroup = async (formData: Partial<AdminGroup>) => {
  try {
    console.log('💾 [Save] Saving group data:', formData)
    if (selectedGroup.value) {
      console.log(`📤 [Save] Updating group: ${selectedGroup.value.id}`)
      await updateGroup(selectedGroup.value.id, formData)
      console.log(`✅ [Save] Group updated: ${selectedGroup.value.id}`)
    } else {
      console.log('➕ [Save] Creating new group:', formData.id)
      await createGroup(formData)
      console.log(`✅ [Save] Group created: ${formData.id}`)
    }
    showGroupModal.value = false
  } catch (error) {
    console.error('❌ [Save] Error saving group:', error)
  }
}

const confirmDeleteGroup = async () => {
  if (!groupToDelete.value) return
  try {
    console.log(`🗑️ [Delete] Deleting group: ${groupToDelete.value.id}`)
    await deleteGroup(groupToDelete.value.id)
    console.log(`✅ [Delete] Group deleted: ${groupToDelete.value.name}`)
    showConfirmDialog.value = false
    groupToDelete.value = null
  } catch (error) {
    console.error('❌ [Delete] Error deleting group:', error)
  }
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
        <GroupForm ref="groupFormRef" :group="selectedGroup" @submit="handleSaveGroup" />
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
