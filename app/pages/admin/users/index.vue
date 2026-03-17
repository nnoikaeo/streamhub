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
const { folders } = useAdminFolders()
const showUserModal = ref(false)
const showConfirmDialog = ref(false)
const selectedUser = ref<User | null>(null)
const userToDelete = ref<User | null>(null)

// Ref to UserForm — triggers its internal useForm validation + submission via defineExpose
const userFormRef = ref<{ submit: () => Promise<void> } | null>(null)

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
 * Action handlers
 */
const handleAddUser = () => {
  console.log('➕ [Action] Add new user')
  selectedUser.value = null
  showUserModal.value = true
}

const handleEditUser = (user: User) => {
  console.log('✏️ [Action] Edit user:', user.email)
  selectedUser.value = user
  showUserModal.value = true
}

const handleDeleteUser = (user: User) => {
  console.log('🗑️ [Action] Delete user:', user.email)
  userToDelete.value = user
  showConfirmDialog.value = true
}

const handleToggleActive = async (user: User) => {
  try {
    await updateUser(user.uid, { isActive: !user.isActive })
    console.log(`✅ User ${user.email} status toggled`)
  } catch (error) {
    console.error('❌ Error toggling user status:', error)
  }
}

const handleSaveUser = async (formData: any) => {
  try {
    console.log('💾 [Save] Saving user data:', formData)
    if (selectedUser.value) {
      console.log(`📤 [Save] Updating user: ${selectedUser.value.email}`)
      await updateUser(selectedUser.value.uid, formData)
      console.log(`✅ [Save] User updated: ${formData.email}`)
    } else {
      console.log('➕ [Save] Creating new user:', formData.uid)
      await createUser(formData)
      console.log(`✅ [Save] User created: ${formData.uid}`)
    }
    showUserModal.value = false
    console.log('🔚 [Save] Modal closed')
  } catch (error) {
    console.error('❌ [Save] Error saving user:', error)
  }
}

const confirmDeleteUser = async () => {
  if (!userToDelete.value) {
    console.warn('⚠️ [Delete] No user selected for deletion')
    return
  }
  try {
    console.log(`🗑️ [Delete] Deleting user: ${userToDelete.value.email}`)
    await deleteUser(userToDelete.value.uid)
    console.log(`✅ [Delete] User deleted: ${userToDelete.value.email}`)
    showConfirmDialog.value = false
    userToDelete.value = null
    console.log('🔚 [Delete] Dialog closed')
  } catch (error) {
    console.error('❌ [Delete] Error deleting user:', error)
  }
}

const clearFilters = () => {
  console.log('🔄 [Filters] Clearing all filters')
  searchQuery.value = ''
  filterRole.value = null
  filterCompany.value = null
  filterActive.value = null
  console.log('✅ [Filters] All filters cleared')
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
    <!-- Main Content -->
    <div class="admin-content">
        <!-- Page Header -->
        <div class="page-header">
          <h1 class="page-header__title">จัดการผู้ใช้</h1>
          <button @click="handleAddUser" class="page-header-action-btn">
            ➕ เพิ่มผู้ใช้ใหม่
          </button>
        </div>

        <!-- Filters -->
        <div class="filters-section">
          <div class="filters-row">
            <!-- Search -->
            <div class="filter-group">
              <input
                v-model="searchQuery"
                type="text"
                class="theme-form-input"
                placeholder="ค้นหาตามอีเมล หรือ ชื่อ..."
              />
            </div>

            <!-- Role Filter -->
            <div class="filter-group">
              <select v-model="filterRole" class="theme-form-select">
                <option :value="null">-- บทบาททั้งหมด --</option>
                <option value="admin">Admin</option>
                <option value="moderator">Moderator</option>
                <option value="user">User</option>
              </select>
            </div>

            <!-- Company Filter -->
            <div class="filter-group">
              <CompanyDropdownFilter
                v-model="filterCompany"
                :companies="companies"
                :regions="regions"
                :show-icon="false"
              />
            </div>

            <!-- Active Filter -->
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
          </div>

          <!-- Results Count -->
          <div class="filter-info">
            <span class="results-count">
              แสดง {{ filteredUsers.length }} จาก {{ users.length }} ผู้ใช้
            </span>
          </div>
        </div>

        <!-- Users Table -->
        <div class="table-section">
          <DataTable
            :columns="columns"
            :data="filteredUsers"
            :loading="loading"
            :actions="actions"
            empty-message="ไม่พบผู้ใช้"
          />
        </div>

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
      </div>
  </PageLayout>
</template>

<style scoped>
.admin-page {
  min-height: 100vh;
}

/* Main Content */
.admin-content {
  padding: var(--spacing-xl) var(--spacing-lg);
  max-width: 1400px;
}

/* Page Header - using theme.css styles with gradient background */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
  gap: var(--spacing-md);
  /* Background gradient from theme.css is inherited */
}

/* Filters Section */
.filters-section {
  background-color: var(--color-bg-primary);
  padding: var(--spacing-xs);
  border-radius: var(--radius-lg);
  margin-bottom: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
}

.filters-row {
  display: flex;
  gap: var(--spacing-md);
  flex-wrap: wrap;
  margin-bottom: var(--spacing-md);
}

.filter-group {
  flex: 1;
  min-width: 200px;
}

.filter-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  color: var(--color-text-secondary);
}

.results-count {
  font-weight: 500;
}

/* Table Section */
.table-section {
  background-color: var(--color-bg-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

/* Responsive */
@media (min-width: 768px) and (max-width: 1024px) {
  .filters-row {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .admin-content {
    padding: var(--spacing-lg) var(--spacing-md);
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .filters-row {
    flex-direction: column;
  }

  .filter-group {
    min-width: auto;
  }
}
</style>
