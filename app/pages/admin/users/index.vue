<script setup lang="ts">
import PageLayout from '~/components/compositions/PageLayout.vue'
import UserForm from '~/components/admin/forms/UserForm.vue'
import { useAdminBreadcrumbs } from '~/composables/useAdminBreadcrumbs'
/**
 * Admin Users Management Page
 *
 * Features:
 * - Display all users in DataTable
 * - CRUD operations (Create, Read, Update, Delete)
 * - Filter by role, company, active status
 * - Search by email or name
 * - Bulk actions (select, delete)
 * - Protected by admin middleware
 *
 * Route: /admin/users
 * Middleware: auth, admin
 *
 * WORKFLOW:
 * 1. Page loads → auth & admin middleware checks
 * 2. onMounted → fetchUsers() loads all users from useAdminUsers composable
 * 3. DataTable renders users with columns (email, name, role, company, groups, isActive)
 * 4. User actions:
 *    - Click "เพิ่มผู้ใช้ใหม่" → handleAddUser → showUserModal
 *    - Click "แก้ไข" → handleEditUser → showUserModal with selectedUser
 *    - Click "ลบ" → handleDeleteUser → showConfirmDialog with userToDelete
 * 5. FormModal with UserForm → userFormRef.submit() → validates → handleSaveUser
 * 6. ConfirmDialog → confirmDeleteUser → deleteUser API call
 * 7. Filters: search, role, company, active status → filteredUsers computed property
 *
 * COMPONENTS USED:
 * - DataTable: Generic table component (auto-imported from ~/components/admin)
 * - FormModal: Modal wrapper for user form (auto-imported from ~/components/admin)
 * - UserForm: Form component for editing user data (explicitly imported - nested in ~/components/admin/forms/)
 * - ConfirmDialog: Confirmation dialog for delete action (auto-imported from ~/components/admin)
 *
 * COMPOSABLES USED:
 * - useAdminUsers: Fetch, update, delete users
 * - useAdminCompanies: Fetch companies for filter dropdown
 * - useAdminFolders: Fetch folders for breadcrumb
 * - useAdminBreadcrumbs: Generate breadcrumb navigation
 */

import { ref, computed, onMounted, watch } from 'vue'
import type { User } from '~/types/dashboard'
import { useAdminUsers } from '~/composables/useAdminUsers'
import { useAdminCompanies } from '~/composables/useAdminCompanies'
import { useAdminRegions } from '~/composables/useAdminRegions'
import { useAdminFolders } from '~/composables/useAdminFolders'
import { useAdminCrudPage } from '~/composables/useAdminCrudPage'

const { breadcrumbs } = useAdminBreadcrumbs()

// Page meta
definePageMeta({
  middleware: ['auth', 'admin'],
  layout: 'default',
})

console.log('📄 [admin/users/index.vue] Users management page initialized')

// States
const { users, loading, fetchUsers, createUser, updateUser, deleteUser } = useAdminUsers()
const { companies, fetchCompanies } = useAdminCompanies()
const { regions, fetchRegions } = useAdminRegions()
const { folders, buildFolderTree } = useAdminFolders()

// CRUD page state (modal, dialog, handlers)
const {
  showFormModal: showUserModal,
  showConfirmDialog,
  showToggleDialog,
  selectedItem: selectedUser,
  itemToDelete: userToDelete,
  itemToToggle: userToToggle,
  formRef: userFormRef,
  handleAdd: handleAddUser,
  handleEdit: handleEditUser,
  handleDelete: handleDeleteUser,
  handleToggleActive,
  handleSave: handleSaveUser,
  confirmDelete: confirmDeleteUser,
} = useAdminCrudPage<User>({
  idKey: 'uid',
  displayKey: 'email',
  createFn: createUser,
  updateFn: updateUser,
  deleteFn: deleteUser,
  resourceLabel: 'ผู้ใช้',
})

const { showToast } = useAppToast()

// Ref to UserForm — triggers its internal useForm validation + submission via defineExpose
// (userFormRef provided by useAdminCrudPage)

// Debug: Log state changes
watch(() => showUserModal.value, (newVal) => {
  console.log(`🪟 [UserModal] ${newVal ? 'OPENED' : 'CLOSED'}`, selectedUser.value)
})

watch(() => showConfirmDialog.value, (newVal) => {
  console.log(`⚠️ [ConfirmDialog] ${newVal ? 'OPENED' : 'CLOSED'}`, userToDelete.value)
})

watch(() => loading.value, (newVal) => {
  console.log(`⏳ [Loading] ${newVal ? 'STARTED' : 'FINISHED'}`)
})

watch(() => users.value.length, (newLen) => {
  console.log(`👥 [Users] Loaded ${newLen} users`)
})

// Filters
const searchQuery = ref('')
const filterRole = ref<string | null>(null)
const filterCompany = ref<string | null>(null)
const filterActive = ref<boolean | null>(null)

/**
 * Column definitions for DataTable (Reordered)
 * - Name+Email combined display
 * - Role badge (styled by role: admin, moderator, user)
 * - Company
 * - Groups badges (comma-separated to individual badges)
 * - Status toggle switch (green when enabled)
 * - Actions (icons only)
 */
const columns = [
  { key: 'name', label: 'ชื่อ', sortable: true, width: '180px', isNameColumn: true },
  { key: 'role', label: 'บทบาท', sortable: true, width: '95px', isRoleColumn: true },
  { key: 'company', label: 'บริษัท', sortable: true, width: '105px', align: 'center' as const },
  { key: 'groups', label: 'กลุ่ม', width: '130px', isGroupsColumn: true },
  { key: 'isActive', label: 'สถานะ', sortable: true, width: '85px', isStatusColumn: true },
]

/**
 * Filter and search users
 */
const filteredUsers = computed(() => {
  return users.value.filter(user => {
    // Search filter
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      const matches =
        user.email.toLowerCase().includes(query) ||
        user.name.toLowerCase().includes(query)
      if (!matches) return false
    }

    // Role filter
    if (filterRole.value && user.role !== filterRole.value) {
      return false
    }

    // Company filter
    if (filterCompany.value && user.company !== filterCompany.value) {
      return false
    }

    // Active status filter
    if (filterActive.value !== null && user.isActive !== filterActive.value) {
      return false
    }

    return true
  })
})

/**
 * Custom toggle with toast (page-specific override)
 */
const confirmToggleActive = async () => {
  if (!userToToggle.value) return
  const user = userToToggle.value
  const newStatus = !user.isActive
  try {
    await updateUser(user.uid, { isActive: newStatus })
    showToggleDialog.value = false
    showToast(
      newStatus
        ? `เปิดใช้งาน ${user.name || user.email} เรียบร้อยแล้ว`
        : `ปิดใช้งาน ${user.name || user.email} เรียบร้อยแล้ว`
    )
    userToToggle.value = null
  } catch (error) {
    console.error('❌ Error toggling user status:', error)
    showToggleDialog.value = false
    showToast('เกิดข้อผิดพลาดในการเปลี่ยนสถานะผู้ใช้', 'error')
    userToToggle.value = null
  }
}

const clearFilters = () => {
  searchQuery.value = ''
  filterRole.value = null
  filterCompany.value = null
  filterActive.value = null
}

/**
 * Action buttons for table rows
 */
const actions = [
  {
    label: 'แก้ไข',
    icon: '✏️',
    onClick: handleEditUser,
    variant: 'primary' as const,
  },
  {
    label: 'ลบ',
    icon: '🗑️',
    onClick: handleDeleteUser,
    variant: 'danger' as const,
  },
]

onMounted(async () => {
  try {
    console.log('🚀 [Lifecycle] onMounted - Starting to fetch users...')
    await Promise.all([
      fetchUsers(),
      fetchCompanies(),
      fetchRegions(),
    ])
    console.log('✅ [Lifecycle] onMounted - Users fetched successfully')
  } catch (error) {
    console.error('❌ [Lifecycle] Error loading users:', error)
  }
})

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
        <h1 class="page-header__title">จัดการผู้ใช้</h1>
        <button @click="handleAddUser" class="page-header-action-btn">
          ➕ เพิ่มผู้ใช้ใหม่
        </button>
      </template>

      <template #filters>
        <div class="filter-group">
          <input
            v-model="searchQuery"
            type="text"
            class="theme-form-input"
            placeholder="ค้นหาตามอีเมล หรือ ชื่อ..."
          />
        </div>
        <div class="filter-group">
          <select v-model="filterRole" class="theme-form-select">
            <option :value="null">-- บทบาททั้งหมด --</option>
            <option value="admin">Admin</option>
            <option value="moderator">Moderator</option>
            <option value="user">User</option>
          </select>
        </div>
        <div class="filter-group">
          <CompanyDropdownFilter
            v-model="filterCompany"
            :companies="companies"
            :regions="regions"
            :show-icon="false"
            placeholder="-- ทุกบริษัท --"
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
          :data="filteredUsers"
          :loading="loading"
          :actions="actions"
          empty-message="ไม่พบผู้ใช้"
          @toggle-active="handleToggleActive"
        />
      </template>

      <!-- User Form Modal -->
      <FormModal
        v-model="showUserModal"
        :title="selectedUser ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'"
        :loading="loading"
        @save="userFormRef?.submit()"
        @cancel="showUserModal = false"
      >
        <UserForm ref="userFormRef" :user="selectedUser" @submit="handleSaveUser" />
      </FormModal>

      <!-- Delete Confirmation Dialog -->
      <ConfirmDialog
        :is-open="showConfirmDialog"
        title="ลบผู้ใช้"
        :message="`คุณแน่ใจว่าต้องการลบผู้ใช้ ${userToDelete?.name} (${userToDelete?.email}) หรือไม่?`"
        :loading="loading"
        @confirm="confirmDeleteUser"
        @cancel="showConfirmDialog = false"
      />

      <!-- Toggle Active Confirmation Dialog -->
      <ConfirmDialog
        :is-open="showToggleDialog"
        :title="userToToggle?.isActive ? 'ปิดใช้งานผู้ใช้' : 'เปิดใช้งานผู้ใช้'"
        :message="userToToggle?.isActive
          ? `คุณแน่ใจว่าต้องการปิดใช้งาน ${userToToggle?.name} (${userToToggle?.email}) หรือไม่? ผู้ใช้จะไม่สามารถเข้าสู่ระบบได้`
          : `คุณแน่ใจว่าต้องการเปิดใช้งาน ${userToToggle?.name} (${userToToggle?.email}) หรือไม่?`"
        :loading="loading"
        :is-danger="userToToggle?.isActive"
        :confirm-text="userToToggle?.isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน'"
        @confirm="confirmToggleActive"
        @cancel="showToggleDialog = false; userToToggle = null"
      />
    </AdminPageContent>
  </PageLayout>
</template>

<style scoped>
</style>
