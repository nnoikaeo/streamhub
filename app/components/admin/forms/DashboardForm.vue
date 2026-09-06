<script setup lang="ts">
/**
 * DashboardForm Component
 * Form for creating and editing dashboards in admin panel
 *
 * Features:
 * - Fields: Name, Description, Folder, type-specific embed URL, Archived
 * - Type is looker or sheet; the URL input swaps with it
 * - Uses FormField component for consistent styling
 */

import type { Dashboard, DashboardType, Folder, SheetEmbedMode, User } from '~/types/dashboard'
import type { Tag } from '~/types/tag'
import { useAdminFolders } from '~/composables/useAdminFolders'
import { useAuthStore } from '~/stores/auth'
import { createObjectValidator, validators } from '~/utils/formValidators'
import LookerUrlInput from '~/components/features/LookerUrlInput.vue'
import SheetUrlInput from '~/components/features/SheetUrlInput.vue'
import { onMounted } from 'vue'

interface Props {
  dashboard?: Dashboard | null
  lockedFolderId?: string
  defaultFolderId?: string | null
  showTagSelector?: boolean
  canCreateTag?: boolean
  availableTags?: Tag[]
  availableFolders?: Folder[]
  allUsers?: User[]
}

const props = withDefaults(defineProps<Props>(), {
  showTagSelector: false,
  canCreateTag: false,
  availableTags: () => [],
})
const emit = defineEmits<{
  submit: [data: Partial<Dashboard>]
}>()

const authStore = useAuthStore()
const { folders, fetchFolders } = useAdminFolders()

// Use availableFolders prop if provided, otherwise fall back to all folders
const folderSource = computed(() => props.availableFolders ?? folders.value)

// Folder options
const folderOptions = computed(() =>
  folderSource.value.map(folder => ({
    label: buildFolderPath(folder.id),
    value: folder.id,
  }))
)

/**
 * Build folder path (e.g., "Sales > Monthly > East")
 */
const buildFolderPath = (folderId: string): string => {
  const source = folderSource.value
  const folder = source.find(f => f.id === folderId)
  if (!folder) return ''

  const path: string[] = [folder.name]
  let currentId = folder.parentId

  while (currentId) {
    const parent = source.find(f => f.id === currentId)
    if (!parent) break
    path.unshift(parent.name)
    currentId = parent.parentId
  }

  return path.join(' > ')
}

// Form validation
const baseValidate = createObjectValidator({
  name: [(value) => validators.required(value, 'ชื่อแดชบอร์ด')],
  folderId: [(value) => validators.required(value, 'โฟลเดอร์')],
})

const { formData, errors, handleSubmit, setFieldTouched } = useForm({
  initialValues: {
    id: props.dashboard?.id || `dash_${Date.now()}`,
    name: props.dashboard?.name || '',
    description: props.dashboard?.description || '',
    type: (props.dashboard?.type || 'looker') as DashboardType,
    folderId: props.lockedFolderId || props.dashboard?.folderId || props.defaultFolderId || '',
    lookerDashboardId: props.dashboard?.lookerDashboardId || '',
    lookerEmbedUrl: props.dashboard?.lookerEmbedUrl || '',
    sheetEmbedUrl: props.dashboard?.sheetEmbedUrl || '',
    sheetEmbedMode: (props.dashboard?.sheetEmbedMode || 'interactive') as SheetEmbedMode,
    isArchived: props.dashboard?.isArchived ?? false,
    owner: props.dashboard?.owner || authStore.user?.uid || '',
    tags: props.dashboard?.tags ?? [],
  },
  validate: (values) => {
    return baseValidate(values)
  },
  onSubmit: async (values) => {
    emit('submit', values)
  },
})

const isEditMode = computed(() => !!props.dashboard)

const typeOptions: { label: string, value: DashboardType, hint: string }[] = [
  { label: 'Looker Studio', value: 'looker', hint: 'รายงาน Looker' },
  { label: 'Google Sheets', value: 'sheet', hint: 'ชีตที่แชร์ลิงก์' },
]

// The other type's URL is deliberately kept, not cleared: switching type by
// mistake and switching back should not have thrown the URL away. The server
// reads only the field matching `type`, so the leftover is inert.
const setType = (type: DashboardType) => {
  formData.type = type
}

const ownerDisplayName = computed(() => {
  if (!formData.owner) return '-'
  return props.allUsers?.find(u => u.uid === formData.owner)?.name || formData.owner
})

// Allow parent to trigger validation + submission via template ref (same pattern as FolderForm)
defineExpose({ submit: handleSubmit })

/**
 * Format date for display
 */
const formatDate = (date: Date | undefined): string => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Fetch folders on mount (skip if availableFolders prop is provided)
onMounted(async () => {
  if (!props.availableFolders) {
    await fetchFolders()
  }
})
</script>

<template>
  <form class="dashboard-form" @submit.prevent="handleSubmit">
    <FormField
      v-model="formData.name"
      type="text"
      label="ชื่อแดชบอร์ด"
      placeholder="เช่น Regional Sales Performance"
      :error="errors.name"
      :required="true"
      @blur="setFieldTouched('name')"
    />

    <FormField
      v-model="formData.description"
      type="textarea"
      label="คำอธิบาย"
      placeholder="คำอธิบายเกี่ยวกับแดชบอร์ด"
      :rows="3"
    />

    <FormField
      v-model="formData.folderId"
      type="select"
      label="โฟลเดอร์หลัก"
      :options="folderOptions"
      :error="errors.folderId"
      :required="true"
      :disabled="!!lockedFolderId"
      :hide-blank-option="true"
      :description="'เลือกโฟลเดอร์หลักสำหรับสร้างลำดับชั้น'"
      @blur="setFieldTouched('folderId')"
    />

    <div v-if="showTagSelector" class="form-field-group">
      <label class="form-label">Tags</label>
      <TagSelector
        :model-value="formData.tags"
        :available-tags="availableTags"
        :can-create-tag="canCreateTag"
        @update:model-value="formData.tags = $event"
      />
    </div>

    <!-- Embed type -->
    <div class="form-field-group">
      <label class="form-label">ชนิดแดชบอร์ด</label>
      <div class="type-options" role="group" aria-label="ชนิดแดชบอร์ด">
        <button
          v-for="option in typeOptions"
          :key="option.value"
          type="button"
          class="type-button"
          :class="{ 'type-button--active': formData.type === option.value }"
          @click="setType(option.value)"
        >
          {{ option.label }}
          <span class="type-hint">{{ option.hint }}</span>
        </button>
      </div>
    </div>

    <!-- Embed URL input, by type -->
    <LookerUrlInput
      v-if="formData.type === 'looker'"
      :model-value="formData.lookerEmbedUrl"
      :show-preview="true"
      :preview-height="300"
      @update:model-value="formData.lookerEmbedUrl = $event"
      @update:report-id="formData.lookerDashboardId = $event || ''"
    />
    <SheetUrlInput
      v-else
      :model-value="formData.sheetEmbedUrl"
      :mode="formData.sheetEmbedMode"
      :show-preview="true"
      :preview-height="300"
      @update:model-value="formData.sheetEmbedUrl = $event"
      @update:mode="formData.sheetEmbedMode = $event"
    />

    <!-- Edit-only fields -->
    <template v-if="isEditMode">

      <FormField
        v-model="formData.isArchived"
        type="toggle"
        label="เก็บถาวร (Archived)"
      />

      <p v-if="formData.isArchived" class="form-warning">
        แดชบอร์ดที่ถูกเก็บถาวรจะถูกซ่อนจากผู้ใช้ทั่วไป
      </p>
    </template>

    <!-- Info Section -->
    <div v-if="isEditMode" class="form-info">
      <div class="info-row">
        <span class="info-label">เจ้าของ:</span>
        <span class="info-value">{{ ownerDisplayName }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">สร้างเมื่อ:</span>
        <span class="info-value">{{ formatDate(props.dashboard?.createdAt) }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">แก้ไขล่าสุด:</span>
        <span class="info-value">{{ formatDate(props.dashboard?.updatedAt) }}</span>
      </div>
    </div>
  </form>
</template>

<style scoped>
.dashboard-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg, 1.5rem);
}

.form-field-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs, 0.25rem);
}

.type-options {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.type-button {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.125rem;
  padding: 0.5rem 0.875rem;
  font-size: 0.85rem;
  font-weight: 500;
  text-align: left;
  color: var(--color-text-secondary, #6b7280);
  background: var(--color-bg-secondary, #f3f4f6);
  border: 1px solid var(--color-border, #d1d5db);
  border-radius: var(--radius-md, 0.375rem);
  cursor: pointer;
  transition: all 0.2s;
}

.type-button--active {
  color: var(--color-primary, #3b82f6);
  background: var(--color-bg-info, #eff6ff);
  border-color: var(--color-primary, #3b82f6);
}

.type-hint {
  font-size: 0.7rem;
  font-weight: 400;
  color: var(--color-text-secondary, #94a3b8);
}

.form-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text-primary);
}

.form-warning {
  padding: var(--spacing-md, 1rem);
  background-color: rgba(245, 158, 11, 0.1);
  color: var(--color-warning, #f59e0b);
  border-left: 3px solid var(--color-warning, #f59e0b);
  border-radius: var(--radius-sm, 0.25rem);
  margin: 0;
  font-size: 0.9rem;
}

/* Info Section */
.form-info {
  padding: var(--spacing-md, 1rem);
  background-color: var(--color-bg-secondary, #f3f4f6);
  border-radius: var(--radius-md, 0.375rem);
  border-left: 3px solid var(--color-primary, #3b82f6);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm, 0.5rem);
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
}

.info-label {
  font-weight: 600;
  color: var(--color-text-secondary, #6b7280);
}

.info-value {
  color: var(--color-text-primary, #1f2937);
}

/* Responsive */
@media (max-width: 640px) {
  .info-row {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-xs, 0.25rem);
  }
}
</style>
