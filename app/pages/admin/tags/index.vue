<script setup lang="ts">
import PageLayout from '~/components/compositions/PageLayout.vue'
/**
 * Admin Tags Management Page
 *
 * Features:
 * - Display all tags in DataTable
 * - CRUD operations (Create, Read, Update, Delete)
 * - Search by name or slug
 * - Filter by active status
 * - Protected by canManageTags permission
 *
 * Route: /admin/tags
 * Middleware: auth, admin
 */

import { ref, computed, onMounted } from 'vue'
import type { Tag } from '~/types/tag'
import { useAdminBreadcrumbs } from '~/composables/useAdminBreadcrumbs'
import { useAdminTags } from '~/composables/useAdminTags'
import { useAdminFolders } from '~/composables/useAdminFolders'
import { usePermissionsStore } from '~/stores/permissions'
import { useAdminCrudPage } from '~/composables/useAdminCrudPage'

definePageMeta({
  middleware: ['auth', 'admin'],
  layout: 'default',
})

const { breadcrumbs } = useAdminBreadcrumbs()
const { tags, loading, fetchTags, createTag, updateTag, deleteTag } = useAdminTags()
const { folders, buildFolderTree } = useAdminFolders()
const permissions = usePermissionsStore()

// Guard: redirect if no permission
if (!permissions.can('canManageTags')) {
  navigateTo('/admin/overview')
}

// CRUD page state (modal, dialog, handlers)
const {
  showFormModal: showTagModal,
  showConfirmDialog,
  showToggleDialog,
  selectedItem: selectedTag,
  itemToDelete: tagToDelete,
  itemToToggle: tagToToggle,
  formRef: tagFormRef,
  handleAdd: handleAddTag,
  handleEdit: handleEditTag,
  handleDelete: handleDeleteTag,
  handleToggleActive,
  confirmToggleActive,
  handleSave: handleSaveTag,
  confirmDelete: confirmDeleteTag,
} = useAdminCrudPage<Tag>({
  idKey: 'id',
  displayKey: 'name',
  createFn: createTag,
  updateFn: updateTag,
  deleteFn: deleteTag,
})

// Filters
const searchQuery = ref('')
const filterActive = ref<boolean | null>(null)

const columns = [
  { key: 'name', label: 'แท็ก', sortable: true, width: '200px' },
  { key: 'slug', label: 'Slug', sortable: true, width: '150px' },
  { key: 'description', label: 'คำอธิบาย', width: '280px' },
  { key: 'isActive', label: 'สถานะ', sortable: true, width: '100px', isStatusColumn: true },
]

const filteredTags = computed(() => {
  return tags.value.filter(tag => {
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      if (!tag.name.toLowerCase().includes(q) && !tag.slug.toLowerCase().includes(q)) return false
    }
    if (filterActive.value !== null && tag.isActive !== filterActive.value) return false
    return true
  })
})

const clearFilters = () => {
  searchQuery.value = ''
  filterActive.value = null
}

const actions = [
  {
    label: 'แก้ไข',
    icon: '✏️',
    onClick: handleEditTag,
    variant: 'primary' as const,
  },
  {
    label: 'ลบ',
    icon: '🗑️',
    onClick: handleDeleteTag,
    variant: 'danger' as const,
  },
]

onMounted(async () => {
  try {
    await fetchTags()
  } catch (error) {
    console.error('❌ [Lifecycle] Error loading tags:', error)
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
        <h1 class="page-header__title">จัดการแท็ก</h1>
        <button @click="handleAddTag" class="page-header-action-btn">
          ➕ เพิ่มแท็กใหม่
        </button>
      </template>

      <template #filters>
        <div class="filter-group">
          <input
            v-model="searchQuery"
            type="text"
            class="theme-form-input"
            placeholder="ค้นหาตามชื่อหรือ slug..."
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
          :data="filteredTags"
          :loading="loading"
          :actions="actions"
          empty-message="ไม่พบแท็ก"
          @toggleActive="handleToggleActive"
        />
      </template>

      <!-- Tag Form Modal -->
      <FormModal
        v-model="showTagModal"
        :title="selectedTag ? 'แก้ไขแท็ก' : 'เพิ่มแท็กใหม่'"
        size="lg"
        :loading="loading"
        @save="tagFormRef?.submit()"
        @cancel="showTagModal = false"
      >
        <TagForm ref="tagFormRef" :tag="selectedTag" @submit="handleSaveTag" />
      </FormModal>

      <!-- Delete Confirmation Dialog -->
      <ConfirmDialog
        :is-open="showConfirmDialog"
        title="ลบแท็ก"
        :message="`คุณแน่ใจว่าต้องการลบแท็ก '${tagToDelete?.name}' หรือไม่?`"
        :loading="loading"
        @confirm="confirmDeleteTag"
        @cancel="showConfirmDialog = false"
      />

      <!-- Toggle Active Confirmation Dialog -->
      <ConfirmDialog
        :is-open="showToggleDialog"
        :title="tagToToggle?.isActive ? 'ปิดใช้งานแท็ก' : 'เปิดใช้งานแท็ก'"
        :message="tagToToggle?.isActive
          ? `คุณต้องการปิดใช้งานแท็ก '${tagToToggle?.name}' หรือไม่?`
          : `คุณต้องการเปิดใช้งานแท็ก '${tagToToggle?.name}' หรือไม่?`"
        :confirm-text="tagToToggle?.isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน'"
        :is-danger="tagToToggle?.isActive"
        :loading="loading"
        @confirm="confirmToggleActive"
        @cancel="showToggleDialog = false; tagToToggle = null"
      />
    </AdminPageContent>
  </PageLayout>
</template>
