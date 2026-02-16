<script setup lang="ts">
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
 */

import { ref, computed, onMounted } from 'vue'
import type { User } from '~/types/dashboard'
import { mockUsers, mockCompanies, mockFolders } from '~/composables/useMockData'
import UnifiedSidebar from '~/components/layouts/UnifiedSidebar.vue'

// Page meta
definePageMeta({
  middleware: ['auth', 'admin'],
  layout: 'default',
})

console.log('📄 [admin/users/index.vue] Users management page mounted')

// States
const users = ref<User[]>([...mockUsers])
const loading = ref(false)
const showUserModal = ref(false)
const showConfirmDialog = ref(false)
const selectedUser = ref<User | null>(null)
const userToDelete = ref<User | null>(null)

// Filters
const searchQuery = ref('')
const filterRole = ref<string | null>(null)
const filterCompany = ref<string | null>(null)
const filterActive = ref<boolean | null>(null)

/**
 * Column definitions for DataTable
 */
const columns = [
  { key: 'email', label: 'อีเมล', sortable: true, width: '200px' },
  { key: 'name', label: 'ชื่อ', sortable: true, width: '180px' },
  { key: 'role', label: 'บทบาท', sortable: true, width: '120px' },
  { key: 'company', label: 'บริษัท', sortable: true, width: '120px' },
  { key: 'groups', label: 'กลุ่ม', width: '150px' },
  { key: 'isActive', label: 'สถานะ', sortable: true, width: '100px' },
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
  selectedUser.value = null
  showUserModal.value = true
}

const handleEditUser = (user: User) => {
  selectedUser.value = user
  showUserModal.value = true
}

const handleDeleteUser = (user: User) => {
  userToDelete.value = user
  showConfirmDialog.value = true
}

const handleToggleActive = async (user: User) => {
  loading.value = true
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300))

    const index = users.value.findIndex(u => u.uid === user.uid)
    if (index !== -1) {
      users.value[index].isActive = !users.value[index].isActive
    }

    console.log(`✅ User ${user.email} status toggled`)
  } catch (error) {
    console.error('❌ Error toggling user status:', error)
  } finally {
    loading.value = false
  }
}

const handleSaveUser = async (formData: any) => {
  loading.value = true
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))

    if (selectedUser.value) {
      // Update existing user
      const index = users.value.findIndex(u => u.uid === selectedUser.value!.uid)
      if (index !== -1) {
        users.value[index] = {
          ...users.value[index],
          ...formData,
          updatedAt: new Date(),
        }
      }
      console.log(`✅ User updated: ${formData.email}`)
    } else {
      // Create new user
      const newUser: User = {
        uid: formData.uid,
        email: formData.email,
        name: formData.name,
        role: formData.role,
        company: formData.company,
        groups: formData.groups,
        isActive: formData.isActive,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      users.value.push(newUser)
      console.log(`✅ User created: ${formData.email}`)
    }

    showUserModal.value = false
  } catch (error) {
    console.error('❌ Error saving user:', error)
  } finally {
    loading.value = false
  }
}

const confirmDeleteUser = async () => {
  if (!userToDelete.value) return

  loading.value = true
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))

    const index = users.value.findIndex(u => u.uid === userToDelete.value!.uid)
    if (index !== -1) {
      const deletedUser = users.value.splice(index, 1)[0]
      console.log(`✅ User deleted: ${deletedUser.email}`)
    }

    showConfirmDialog.value = false
    userToDelete.value = null
  } catch (error) {
    console.error('❌ Error deleting user:', error)
  } finally {
    loading.value = false
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

onMounted(() => {
  console.log('📊 Loaded', users.value.length, 'users')
})
</script>

<template>
  <div class="admin-page">
    <AppLayout show-sidebar>
      <!-- Unified Sidebar -->
      <template #sidebar>
        <UnifiedSidebar
          :folders="mockFolders"
          show-folders
          show-admin
          :allow-search="true"
          :allow-create="false"
        />
      </template>

      <!-- Main Content -->
      <div class="admin-content">
        <!-- Page Header -->
        <div class="page-header">
          <h1 class="page-title">จัดการผู้ใช้</h1>
          <button @click="handleAddUser" class="btn btn--primary">
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
                class="filter-input"
                placeholder="ค้นหาตามอีเมล หรือ ชื่อ..."
              />
            </div>

            <!-- Role Filter -->
            <div class="filter-group">
              <select v-model="filterRole" class="filter-select">
                <option :value="null">-- บทบาททั้งหมด --</option>
                <option value="admin">Admin</option>
                <option value="moderator">Moderator</option>
                <option value="user">User</option>
              </select>
            </div>

            <!-- Company Filter -->
            <div class="filter-group">
              <select v-model="filterCompany" class="filter-select">
                <option :value="null">-- บริษัททั้งหมด --</option>
                <option v-for="c in mockCompanies" :key="c.code" :value="c.code">
                  {{ c.code }}
                </option>
              </select>
            </div>

            <!-- Active Filter -->
            <div class="filter-group">
              <select v-model="filterActive" class="filter-select">
                <option :value="null">-- สถานะทั้งหมด --</option>
                <option :value="true">เปิดใช้งาน</option>
                <option :value="false">ปิดใช้งาน</option>
              </select>
            </div>

            <!-- Clear Filters -->
            <button @click="clearFilters" class="btn btn--ghost">
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
          @save="handleSaveUser"
          @cancel="showUserModal = false"
        >
          <UserForm :user="selectedUser" @submit="handleSaveUser" />
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
    </AppLayout>
  </div>
</template>

<style scoped>
.admin-page {
  min-height: 100vh;
}

/* Main Content */
.admin-content {
  padding: var(--spacing-xl, 2rem) var(--spacing-lg, 1.25rem);
  max-width: 1400px;
}

/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl, 2rem);
  gap: var(--spacing-md, 1rem);
}

.page-title {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-text-primary, #1f2937);
}

/* Button */
.btn {
  padding: var(--spacing-sm, 0.5rem) var(--spacing-lg, 1rem);
  border-radius: var(--radius-md, 0.375rem);
  font-size: 0.95rem;
  font-weight: 600;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all var(--transition-base, 0.2s ease);
}

.btn--primary {
  background-color: var(--color-primary, #3b82f6);
  color: white;
}

.btn--primary:hover {
  background-color: #2563eb;
  box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
}

.btn--ghost {
  background-color: transparent;
  color: var(--color-text-secondary, #6b7280);
  border-color: var(--color-border-light, #e5e7eb);
}

.btn--ghost:hover {
  background-color: var(--color-bg-secondary, #f3f4f6);
  color: var(--color-text-primary, #1f2937);
}

/* Filters Section */
.filters-section {
  background-color: var(--color-bg-primary, #ffffff);
  padding: var(--spacing-lg, 1.25rem);
  border-radius: var(--radius-lg, 0.5rem);
  margin-bottom: var(--spacing-lg, 1.25rem);
  box-shadow: var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
}

.filters-row {
  display: flex;
  gap: var(--spacing-md, 1rem);
  flex-wrap: wrap;
  margin-bottom: var(--spacing-md, 1rem);
}

.filter-group {
  flex: 1;
  min-width: 200px;
}

.filter-input,
.filter-select {
  width: 100%;
  padding: var(--spacing-sm, 0.5rem) var(--spacing-md, 1rem);
  border: 1px solid var(--color-border-light, #e5e7eb);
  border-radius: var(--radius-md, 0.375rem);
  font-size: 0.95rem;
  background-color: var(--color-bg-primary, #ffffff);
  color: var(--color-text-primary, #1f2937);
  transition: all var(--transition-base, 0.2s ease);
}

.filter-input:focus,
.filter-select:focus {
  outline: none;
  border-color: var(--color-primary, #3b82f6);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.filter-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  color: var(--color-text-secondary, #6b7280);
}

.results-count {
  font-weight: 500;
}

/* Table Section */
.table-section {
  background-color: var(--color-bg-primary, #ffffff);
  border-radius: var(--radius-lg, 0.5rem);
  box-shadow: var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
  overflow: hidden;
}

/* Responsive */
@media (max-width: 768px) {
  .admin-content {
    padding: var(--spacing-lg, 1.25rem) var(--spacing-md, 1rem);
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
