<script setup lang="ts">
import PageLayout from '~/components/compositions/PageLayout.vue'
/**
 * Admin Groups Management Page
 *
 * Features:
 * - Display all groups in DataTable
 * - CRUD operations
 * - Search by name
 * - Manage group members
 * - Protected by admin middleware
 *
 * Route: /admin/groups
 * Middleware: auth, admin
 */

import { ref, computed, onMounted } from 'vue'
import { useAdminBreadcrumbs } from '~/composables/useAdminBreadcrumbs'
import { useAdminGroups } from '~/composables/useAdminGroups'
import { useAdminFolders } from '~/composables/useAdminFolders'

interface GroupData {
  id: string
  name: string
  description?: string
  members: string[]
}

definePageMeta({
  middleware: ['auth', 'admin'],
  layout: 'default',
})

const { breadcrumbs } = useAdminBreadcrumbs()
const { groups, loading, fetchGroups, updateGroup, deleteGroup } = useAdminGroups()
const { folders } = useAdminFolders()
const showGroupModal = ref(false)
const showConfirmDialog = ref(false)
const selectedGroup = ref<GroupData | null>(null)
const groupToDelete = ref<GroupData | null>(null)

const searchQuery = ref('')

const columns = [
  { key: 'id', label: 'รหัสกลุ่ม', sortable: true, width: '150px' },
  { key: 'name', label: 'ชื่อกลุ่ม', sortable: true, width: '180px' },
  { key: 'description', label: 'คำอธิบาย', width: '250px' },
  { key: 'membersCount', label: 'สมาชิก', width: '120px' },
]

const filteredGroups = computed(() => {
  return groups.value.filter(group => {
    if (!searchQuery.value) return true
    const query = searchQuery.value.toLowerCase()
    return group.name.toLowerCase().includes(query) || group.id.toLowerCase().includes(query)
  })
})

const getMembersCount = (members: string[]): number => members.length

const handleAddGroup = () => {
  selectedGroup.value = null
  showGroupModal.value = true
}

const handleEditGroup = (group: GroupData) => {
  selectedGroup.value = { ...group }
  showGroupModal.value = true
}

const handleDeleteGroup = (group: GroupData) => {
  groupToDelete.value = group
  showConfirmDialog.value = true
}

const handleSaveGroup = async (formData: any) => {
  try {
    if (selectedGroup.value) {
      await updateGroup(selectedGroup.value.id, formData)
    } else {
      // Note: createGroup would be called here
      console.warn('Create group not yet implemented')
    }
    showGroupModal.value = false
  } catch (error) {
    console.error('Error saving group:', error)
  }
}

const confirmDeleteGroup = async () => {
  if (!groupToDelete.value) return
  try {
    await deleteGroup(groupToDelete.value.id)
    showConfirmDialog.value = false
    groupToDelete.value = null
  } catch (error) {
    console.error('Error deleting group:', error)
  }
}

const clearFilters = () => {
  searchQuery.value = ''
}

const actions = [
  { label: 'แก้ไข', icon: '✏️', onClick: handleEditGroup, variant: 'primary' as const },
  { label: 'ลบ', icon: '🗑️', onClick: handleDeleteGroup, variant: 'danger' as const },
]

// Customize data display for table
const displayGroups = computed(() => {
  return filteredGroups.value.map(g => ({
    ...g,
    membersCount: getMembersCount(g.members),
  }))
})

onMounted(async () => {
  try {
    await fetchGroups()
  } catch (error) {
    console.error('Error loading groups:', error)
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
          <h1 class="page-header__title">จัดการกลุ่ม</h1>
          <button @click="handleAddGroup" class="page-header-action-btn">
            ➕ เพิ่มกลุ่มใหม่
          </button>
        </div>

        <div class="filters-section">
          <div class="filters-row">
            <div class="filter-group">
              <input
                v-model="searchQuery"
                type="text"
                class="theme-form-input"
                placeholder="ค้นหาตามชื่อหรือรหัสกลุ่ม..."
              />
            </div>

            <button @click="clearFilters" class="theme-btn theme-btn--ghost">
              🔄 ล้างตัวกรอง
            </button>
          </div>

          <div class="filter-info">
            <span class="results-count">
              แสดง {{ filteredGroups.length }} จาก {{ groups.length }} กลุ่ม
            </span>
          </div>
        </div>

        <div class="table-section">
          <DataTable
            :columns="columns"
            :data="displayGroups"
            :loading="loading"
            :actions="actions"
            empty-message="ไม่พบกลุ่ม"
          />
        </div>

        <FormModal
          v-model="showGroupModal"
          :title="selectedGroup ? 'แก้ไขกลุ่ม' : 'เพิ่มกลุ่มใหม่'"
          :loading="loading"
          @save="handleSaveGroup"
          @cancel="showGroupModal = false"
        >
          <GroupForm :group="selectedGroup" @submit="handleSaveGroup" />
        </FormModal>

        <ConfirmDialog
          :is-open="showConfirmDialog"
          title="ลบกลุ่ม"
          :message="`คุณแน่ใจว่าต้องการลบกลุ่ม '${groupToDelete?.name}' หรือไม่?`"
          :loading="loading"
          @confirm="confirmDeleteGroup"
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
