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
import { useAdminFolders } from '~/composables/useAdminFolders'
import { createObjectValidator, validators } from '~/utils/formValidators'
import { onMounted } from 'vue'

interface Props {
  folder?: Folder | null
  allFolders?: Folder[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  submit: [data: Partial<Folder>]
}>()

// Composables
const { folders, fetchFolders } = useAdminFolders()

// Use passed folders or fetch from composable
const folderList = computed(() => props.allFolders || folders.value)

// Form validation
const validate = createObjectValidator({
  name: [(value) => validators.required(value, 'ชื่อโฟลเดอร์')],
})

const form = useForm({
  initialValues: {
    id: props.folder?.id || `folder_${Date.now()}`,
    name: props.folder?.name || '',
    description: props.folder?.description || '',
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
    for (const folder of folderList.value) {
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
  const folder = folderList.value.find(f => f.id === folderId)
  if (!folder) return ''

  const path: string[] = [folder.name]
  let currentId = folder.parentId

  while (currentId) {
    const parent = folderList.value.find(f => f.id === currentId)
    if (!parent) break
    path.unshift(parent.name)
    currentId = parent.parentId
  }

  return path.join(' > ')
}

/**
 * Available parent folders
 * Excludes: self and current descendants
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
    ...folderList.value
      .filter(folder => !excludeIds.has(folder.id))
      .map(folder => ({
        label: buildFolderPath(folder.id),
        value: folder.id,
      })),
  ]
})

// Fetch folders on mount if not passed
onMounted(async () => {
  if (!props.allFolders) {
    await fetchFolders()
  }
})
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
      v-model="form.formData.parentId"
      type="select"
      label="โฟลเดอร์หลัก"
      :options="parentFolderOptions"
      :description="'เลือกโฟลเดอร์หลักสำหรับสร้างลำดับชั้น'"
    />
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
