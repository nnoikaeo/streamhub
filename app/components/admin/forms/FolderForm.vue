<script setup lang="ts">
/**
 * FolderForm Component
 * Form for creating and editing folders in admin panel
 *
 * Features:
 * - Fields: Name, Description, Company, Parent Folder
 * - Parent folder tree selector (excludes self and children)
 * - Company dropdown with active companies only
 * - Validation for required fields
 *
 * Usage:
 * <FolderForm
 *   :folder="selectedFolder"
 *   :all-folders="folders"
 *   @submit="handleSubmit"
 * />
 */

import { ref, computed, onMounted } from 'vue'
import type { Folder } from '~/types/dashboard'
import { mockFolders, mockCompanies } from '~/composables/useMockData'

interface Props {
  /**
   * Folder to edit (null for create mode)
   */
  folder?: Folder | null

  /**
   * All folders for parent selection (defaults to mockFolders)
   */
  allFolders?: Folder[]
}

const props = withDefaults(defineProps<Props>(), {
  allFolders: () => mockFolders,
})

const emit = defineEmits<{
  submit: [data: Partial<Folder>]
}>()

// Form data
const formData = ref({
  id: '',
  name: '',
  description: '',
  company: 'STTH',
  parentId: null as string | null,
})

// Form errors
const errors = ref({
  name: '',
  parentId: '',
})

// Available companies
const companies = computed(() =>
  mockCompanies.filter(c => c.isActive).map(c => ({
    code: c.code,
    label: `${c.code} - ${c.name}`,
  }))
)

/**
 * Get all descendants of a folder (to exclude from parent selection)
 */
const getDescendants = (folderId: string): Set<string> => {
  const descendants = new Set<string>()
  const queue = [folderId]

  while (queue.length > 0) {
    const current = queue.shift()!
    for (const folder of props.allFolders) {
      if (folder.parentId === current) {
        descendants.add(folder.id)
        queue.push(folder.id)
      }
    }
  }

  return descendants
}

/**
 * Available parent folders
 * Excludes: self, current descendants, and other companies
 */
const parentFolderOptions = computed(() => {
  const excludeIds = new Set<string>()
  const currentFolderId = props.folder?.id

  // Exclude self
  if (currentFolderId) {
    excludeIds.add(currentFolderId)
    // Exclude all descendants
    getDescendants(currentFolderId).forEach(id => excludeIds.add(id))
  }

  return props.allFolders
    .filter(folder => {
      // Exclude self and descendants
      if (excludeIds.has(folder.id)) return false
      // Only show folders from same company
      if (folder.company !== formData.value.company) return false
      return true
    })
    .map(folder => ({
      id: folder.id,
      name: folder.name,
      fullPath: buildFolderPath(folder.id),
    }))
})

/**
 * Build folder path (e.g., "Sales > Monthly > East")
 */
const buildFolderPath = (folderId: string): string => {
  const folder = props.allFolders.find(f => f.id === folderId)
  if (!folder) return ''

  const path: string[] = [folder.name]
  let currentId = folder.parentId

  while (currentId) {
    const parent = props.allFolders.find(f => f.id === currentId)
    if (!parent) break
    path.unshift(parent.name)
    currentId = parent.parentId
  }

  return path.join(' > ')
}

/**
 * Initialize form with folder data (edit mode) or empty values (create mode)
 */
const initializeForm = () => {
  if (props.folder) {
    formData.value = {
      id: props.folder.id,
      name: props.folder.name,
      description: props.folder.description || '',
      company: props.folder.company,
      parentId: props.folder.parentId,
    }
  } else {
    formData.value = {
      id: `folder_${Date.now()}`,
      name: '',
      description: '',
      company: 'STTH',
      parentId: null,
    }
  }
  errors.value = { name: '', parentId: '' }
}

/**
 * Validate form
 */
const validateForm = (): boolean => {
  errors.value = { name: '', parentId: '' }

  // Validate name
  if (!formData.value.name.trim()) {
    errors.value.name = 'ชื่อโฟลเดอร์ จำเป็นต้องกรอก'
  }

  return !errors.value.name
}

/**
 * Handle form submission
 */
const handleSubmit = (e: Event) => {
  e.preventDefault()

  if (!validateForm()) {
    return
  }

  emit('submit', { ...formData.value })
}

/**
 * Handle company change - reset parent if not valid for new company
 */
const handleCompanyChange = () => {
  // Reset parent if it's from different company
  if (formData.value.parentId) {
    const parent = props.allFolders.find(f => f.id === formData.value.parentId)
    if (parent && parent.company !== formData.value.company) {
      formData.value.parentId = null
    }
  }
}

onMounted(() => {
  initializeForm()
})
</script>

<template>
  <form @submit.prevent="handleSubmit" class="folder-form">
    <!-- Name Field -->
    <div class="form-group">
      <label for="name" class="form-label">ชื่อโฟลเดอร์ *</label>
      <input
        id="name"
        v-model="formData.name"
        type="text"
        class="form-input"
        :class="{ 'form-input--error': errors.name }"
        placeholder="เช่น Sales Reports"
      />
      <span v-if="errors.name" class="form-error">{{ errors.name }}</span>
    </div>

    <!-- Description Field -->
    <div class="form-group">
      <label for="description" class="form-label">คำอธิบาย</label>
      <textarea
        id="description"
        v-model="formData.description"
        class="form-textarea"
        placeholder="คำอธิบายเกี่ยวกับโฟลเดอร์นี้"
        rows="3"
      ></textarea>
    </div>

    <!-- Company Field -->
    <div class="form-group">
      <label for="company" class="form-label">บริษัท</label>
      <select
        id="company"
        v-model="formData.company"
        class="form-select"
        @change="handleCompanyChange"
        :disabled="!!folder"
      >
        <option v-for="c in companies" :key="c.code" :value="c.code">
          {{ c.label }}
        </option>
      </select>
      <p v-if="!folder" class="form-hint">บริษัท ไม่สามารถเปลี่ยนแปลงหลังสร้างได้</p>
    </div>

    <!-- Parent Folder Field -->
    <div class="form-group">
      <label for="parentId" class="form-label">โฟลเดอร์หลัก (ไม่บังคับ)</label>
      <select
        id="parentId"
        v-model="formData.parentId"
        class="form-select"
      >
        <option :value="null">-- ไม่มีโฟลเดอร์หลัก (Root) --</option>
        <option v-for="parent in parentFolderOptions" :key="parent.id" :value="parent.id">
          {{ parent.fullPath }}
        </option>
      </select>
      <p class="form-hint">
        เลือกโฟลเดอร์หลักสำหรับสร้างลำดับชั้น
      </p>
    </div>

    <!-- Empty Parent Options Warning -->
    <div
      v-if="formData.parentId !== null && parentFolderOptions.length === 0"
      class="form-info form-info--warning"
    >
      ⚠️ ไม่มีโฟลเดอร์หลักในบริษัท {{ formData.company }} ที่เหมาะสม
    </div>
  </form>
</template>

<style scoped>
.folder-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg, 1.25rem);
}

/* Form Group */
.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm, 0.5rem);
}

/* Label */
.form-label {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text-primary, #1f2937);
}

/* Input, Select & Textarea */
.form-input,
.form-select,
.form-textarea {
  padding: var(--spacing-sm, 0.5rem) var(--spacing-md, 1rem);
  border: 1px solid var(--color-border-light, #e5e7eb);
  border-radius: var(--radius-md, 0.375rem);
  font-size: 0.95rem;
  background-color: var(--color-bg-primary, #ffffff);
  color: var(--color-text-primary, #1f2937);
  transition: all var(--transition-base, 0.2s ease);
  font-family: inherit;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--color-primary, #3b82f6);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input:disabled {
  background-color: var(--color-bg-secondary, #f3f4f6);
  color: var(--color-text-secondary, #6b7280);
  cursor: not-allowed;
}

.form-input--error {
  border-color: var(--color-error, #ef4444);
}

.form-input--error:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

/* Error Message */
.form-error {
  font-size: 0.85rem;
  color: var(--color-error, #ef4444);
  font-weight: 500;
}

/* Hint Text */
.form-hint {
  font-size: 0.85rem;
  color: var(--color-text-secondary, #6b7280);
  margin: 0;
}

/* Info Box */
.form-info {
  padding: var(--spacing-md, 1rem);
  background-color: var(--color-bg-secondary, #f3f4f6);
  border-radius: var(--radius-md, 0.375rem);
  border-left: 3px solid var(--color-primary, #3b82f6);
  font-size: 0.9rem;
  color: var(--color-text-secondary, #6b7280);
}

.form-info--warning {
  background-color: rgba(245, 158, 11, 0.1);
  border-left-color: var(--color-warning, #f59e0b);
  color: var(--color-warning, #f59e0b);
}
</style>
