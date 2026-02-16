<script setup lang="ts">
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
import type { User } from '~/types/dashboard'
import { mockUsers, mockGroups, mockFolders } from '~/composables/useMockData'
import UnifiedSidebar from '~/components/layouts/UnifiedSidebar.vue'

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

const groups = ref<GroupData[]>(
  Object.entries(mockGroups).map(([id, group]) => ({
    id,
    name: group.name,
    description: group.description,
    members: [...group.members],
  }))
)
const loading = ref(false)
const showGroupModal = ref(false)
const showConfirmDialog = ref(false)
const selectedGroup = ref<GroupData | null>(null)
const groupToDelete = ref<GroupData | null>(null)

const searchQuery = ref('')

const columns = [
  { key: 'id', label: 'รหัสกลุ่ม', sortable: true, width: '150px' },
  { key: 'name', label: 'ชื่อกลุ่ม', sortable: true, width: '180px' },
  { key: 'description', label: 'คำอธิบาย', width: '250px' },
  { key: 'members', label: 'สมาชิก', width: '120px' },
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
  loading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 500))

    if (selectedGroup.value) {
      const index = groups.value.findIndex(g => g.id === selectedGroup.value!.id)
      if (index !== -1) {
        groups.value[index] = { ...groups.value[index], ...formData }
      }
    } else {
      groups.value.push(formData)
    }

    showGroupModal.value = false
  } finally {
    loading.value = false
  }
}

const confirmDeleteGroup = async () => {
  if (!groupToDelete.value) return
  loading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 500))
    const index = groups.value.findIndex(g => g.id === groupToDelete.value!.id)
    if (index !== -1) {
      groups.value.splice(index, 1)
    }
    showConfirmDialog.value = false
    groupToDelete.value = null
  } finally {
    loading.value = false
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
    members: getMembersCount(g.members),
  }))
})

onMounted(() => {
  console.log('📊 Loaded', groups.value.length, 'groups')
})
</script>

<template>
  <div class="admin-page">
    <AdminLayout>
      <template #sidebar>
        <UnifiedSidebar
          :folders="mockFolders"
          show-folders
          show-admin
          :allow-search="true"
          :allow-create="false"
        />
      </template>

      <div class="admin-content">
        <div class="page-header">
          <h1 class="page-title">จัดการกลุ่ม</h1>
          <button @click="handleAddGroup" class="btn btn--primary">
            ➕ เพิ่มกลุ่มใหม่
          </button>
        </div>

        <div class="filters-section">
          <div class="filters-row">
            <div class="filter-group">
              <input
                v-model="searchQuery"
                type="text"
                class="filter-input"
                placeholder="ค้นหาตามชื่อหรือรหัสกลุ่ม..."
              />
            </div>

            <button @click="clearFilters" class="btn btn--ghost">
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
          <GroupForm :group="selectedGroup" :members="mockUsers" @submit="handleSaveGroup" />
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
.filter-input { width: 100%; padding: var(--spacing-sm, 0.5rem) var(--spacing-md, 1rem); border: 1px solid var(--color-border-light, #e5e7eb); border-radius: var(--radius-md, 0.375rem); font-size: 0.95rem; background-color: var(--color-bg-primary, #ffffff); color: var(--color-text-primary, #1f2937); transition: all var(--transition-base, 0.2s ease); }
.filter-input:focus { outline: none; border-color: var(--color-primary, #3b82f6); box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
.filter-info { display: flex; justify-content: space-between; align-items: center; font-size: 0.9rem; color: var(--color-text-secondary, #6b7280); }
.results-count { font-weight: 500; }
.table-section { background-color: var(--color-bg-primary, #ffffff); border-radius: var(--radius-lg, 0.5rem); box-shadow: var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05)); overflow: hidden; }
@media (max-width: 768px) { .admin-content { padding: var(--spacing-lg, 1.25rem) var(--spacing-md, 1rem); } .page-header { flex-direction: column; align-items: flex-start; } .filters-row { flex-direction: column; } .filter-group { min-width: auto; } }
</style>
