<script setup lang="ts">
/**
 * FolderForm Component (Refactored)
 * Form for creating and editing folders in admin panel
 *
 * Features:
 * - Fields: Name, Description, Company, Parent Folder
 * - Parent folder tree selector (excludes self and children)
 * - Uses FormField component for consistent styling
 */

import type { Folder } from '~/types/dashboard'
import { mockFolders, mockCompanies } from '~/composables/useMockData'
import { createObjectValidator, validators } from '~/utils/formValidators'

interface Props {
  folder?: Folder | null
  allFolders?: Folder[]
}

const props = withDefaults(defineProps<Props>(), {
  allFolders: () => mockFolders,
})

const emit = defineEmits<{
  submit: [data: Partial<Folder>]
}>()

// Company options
const companyOptions = computed(() =>
  mockCompanies.filter(c => c.isActive).map(c => ({
    label: `${c.code} - ${c.name}`,
    value: c.code,
  }))
)

// Form validation
const validate = createObjectValidator({
  name: [(value) => validators.required(value, 'ชื่อโฟลเดอร์')],
})

const form = useForm({
  initialValues: {
    id: props.folder?.id || `folder_${Date.now()}`,
    name: props.folder?.name || '',
    description: props.folder?.description || '',
    company: props.folder?.company || 'STTH',
    parentId: props.folder?.parentId || null,
  },
  validate,
  onSubmit: async (values) => {
    emit('submit', values)
  },
})

const isEditMode = computed(() => !!props.folder)

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

  return [
    { label: 'Root', value: null },
    ...props.allFolders
      .filter(folder => {
        // Exclude self and descendants
        if (excludeIds.has(folder.id)) return false
        // Only show folders from same company
        if (folder.company !== form.formData.company) return false
        return true
      })
      .map(folder => ({
        label: buildFolderPath(folder.id),
        value: folder.id,
      })),
  ]
})

/**
 * Handle company change - reset parent if not valid for new company
 */
const handleCompanyChange = () => {
  if (form.formData.parentId) {
    const parent = props.allFolders.find(f => f.id === form.formData.parentId)
    if (parent && parent.company !== form.formData.company) {
      form.formData.parentId = null
    }
  }
}
</script>

<template>
  <form @submit.prevent="form.handleSubmit" class="folder-form">
    <FormField
      v-model="form.formData.name"
      type="text"
      label="ชื่อโฟลเดอร์"
      placeholder="เช่น Sales Reports"
      :error="form.errors.name"
      :required="true"
      @blur="form.setFieldTouched('name')"
    />

    <FormField
      v-model="form.formData.description"
      type="textarea"
      label="คำอธิบาย"
      placeholder="คำอธิบายเกี่ยวกับโฟลเดอร์นี้"
      :rows="3"
    />

    <FormField
      v-model="form.formData.company"
      type="select"
      label="บริษัท"
      :options="companyOptions"
      :disabled="isEditMode"
      @change="handleCompanyChange"
      :description="!isEditMode ? 'บริษัท ไม่สามารถเปลี่ยนแปลงหลังสร้างได้' : undefined"
    />

    <FormField
      v-model="form.formData.parentId"
      type="select"
      label="โฟลเดอร์หลัก"
      :options="parentFolderOptions"
      :description="'เลือกโฟลเดอร์หลักสำหรับสร้างลำดับชั้น'"
    />

    <div
      v-if="form.formData.parentId !== null && parentFolderOptions.length <= 1"
      class="form-info form-info--warning"
    >
      ⚠️ ไม่มีโฟลเดอร์หลักในบริษัท {{ form.formData.company }} ที่เหมาะสม
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
