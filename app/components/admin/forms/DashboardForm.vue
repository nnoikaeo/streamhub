<script setup lang="ts">
/**
 * DashboardForm Component
 * Form for creating and editing dashboards in admin panel
 *
 * Features:
 * - Fields: Name, Description, Folder, Looker Dashboard ID, Looker Embed URL, Archived
 * - All dashboards are Looker type
 * - Uses FormField component for consistent styling
 */

import type { Dashboard } from '~/types/dashboard'
import { useAdminFolders } from '~/composables/useAdminFolders'
import { useAuthStore } from '~/stores/auth'
import { createObjectValidator, validators } from '~/utils/formValidators'
import { onMounted } from 'vue'

interface Props {
  dashboard?: Dashboard | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  submit: [data: Partial<Dashboard>]
}>()

const authStore = useAuthStore()
const { folders, fetchFolders } = useAdminFolders()

// Folder options
const folderOptions = computed(() =>
  folders.value.map(folder => ({
    label: buildFolderPath(folder.id),
    value: folder.id,
  }))
)

/**
 * Build folder path (e.g., "Sales > Monthly > East")
 */
const buildFolderPath = (folderId: string): string => {
  const folder = folders.value.find(f => f.id === folderId)
  if (!folder) return ''

  const path: string[] = [folder.name]
  let currentId = folder.parentId

  while (currentId) {
    const parent = folders.value.find(f => f.id === currentId)
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

const form = useForm({
  initialValues: {
    id: props.dashboard?.id || `dash_${Date.now()}`,
    name: props.dashboard?.name || '',
    description: props.dashboard?.description || '',
    type: 'looker' as const,
    folderId: props.dashboard?.folderId || '',
    lookerDashboardId: props.dashboard?.lookerDashboardId || '',
    lookerEmbedUrl: props.dashboard?.lookerEmbedUrl || '',
    isArchived: props.dashboard?.isArchived ?? false,
    owner: props.dashboard?.owner || authStore.user?.uid || '',
  },
  validate: (values) => {
    const errors = baseValidate(values)
    if (!values.lookerDashboardId?.trim()) {
      errors.lookerDashboardId = 'Looker Dashboard ID จำเป็นต้องกรอก'
    }
    return errors
  },
  onSubmit: async (values) => {
    emit('submit', values)
  },
})

const isEditMode = computed(() => !!props.dashboard)

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

// Fetch folders on mount
onMounted(async () => {
  await fetchFolders()
})
</script>

<template>
  <form @submit.prevent="form.handleSubmit" class="dashboard-form">
    <FormField
      v-model="form.formData.name"
      type="text"
      label="ชื่อแดชบอร์ด"
      placeholder="เช่น Regional Sales Performance"
      :error="form.errors.name"
      :required="true"
      @blur="form.setFieldTouched('name')"
    />

    <FormField
      v-model="form.formData.description"
      type="textarea"
      label="คำอธิบาย"
      placeholder="คำอธิบายเกี่ยวกับแดชบอร์ด"
      :rows="3"
    />

    <FormField
      v-model="form.formData.folderId"
      type="select"
      label="โฟลเดอร์"
      :options="folderOptions"
      :error="form.errors.folderId"
      :required="true"
      @blur="form.setFieldTouched('folderId')"
    />

    <FormField
      v-model="form.formData.lookerDashboardId"
      type="text"
      label="Looker Dashboard ID"
      placeholder="เช่น dashboard_123"
      :error="form.errors.lookerDashboardId"
      :required="true"
      @blur="form.setFieldTouched('lookerDashboardId')"
    />

    <FormField
      v-model="form.formData.lookerEmbedUrl"
      type="text"
      label="Looker Embed URL"
      placeholder="https://looker.example.com/dashboards/123"
    />

    <FormField
      v-model="form.formData.isArchived"
      type="checkbox"
      label="เก็บถาวร (Archived)"
    />

    <p v-if="form.formData.isArchived" class="form-warning">
      แดชบอร์ดที่ถูกเก็บถาวรจะถูกซ่อนจากผู้ใช้ทั่วไป
    </p>

    <!-- Info Section -->
    <div v-if="isEditMode" class="form-info">
      <div class="info-row">
        <span class="info-label">เจ้าของ:</span>
        <span class="info-value">{{ form.formData.owner }}</span>
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
  gap: var(--spacing-lg, 1.25rem);
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
