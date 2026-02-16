<script setup lang="ts">
/**
 * DashboardForm Component
 * Form for creating and editing dashboards in admin panel
 *
 * Features:
 * - Fields: Name, Description, Type, Folder, Looker ID, Looker Embed URL, Archived
 * - Type dropdown: looker, custom, external
 * - Conditional fields based on type
 * - Folder dropdown selector
 * - Owner display field (auto-set to current user)
 * - Display-only timestamps
 *
 * Usage:
 * <DashboardForm
 *   :dashboard="selectedDashboard"
 *   :owner-email="currentUserEmail"
 *   @submit="handleSubmit"
 * />
 */

import { ref, computed, onMounted } from 'vue'
import type { Dashboard } from '~/types/dashboard'
import { mockFolders } from '~/composables/useMockData'
import { useAuthStore } from '~/stores/auth'

interface Props {
  /**
   * Dashboard to edit (null for create mode)
   */
  dashboard?: Dashboard | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  submit: [data: Partial<Dashboard>]
}>()

const authStore = useAuthStore()

// Form data
const formData = ref({
  id: '',
  name: '',
  description: '',
  type: 'looker' as const,
  folderId: '',
  lookerDashboardId: '',
  lookerEmbedUrl: '',
  isArchived: false,
  owner: '',
})

// Form errors
const errors = ref({
  name: '',
  type: '',
  folderId: '',
  lookerDashboardId: '',
})

// Folder options
const folderOptions = computed(() =>
  mockFolders.map(folder => ({
    id: folder.id,
    name: folder.name,
    parentId: folder.parentId,
    fullPath: buildFolderPath(folder.id),
  }))
)

/**
 * Build folder path (e.g., "Sales > Monthly > East")
 */
const buildFolderPath = (folderId: string): string => {
  const folder = mockFolders.find(f => f.id === folderId)
  if (!folder) return ''

  const path: string[] = [folder.name]
  let currentId = folder.parentId

  while (currentId) {
    const parent = mockFolders.find(f => f.id === currentId)
    if (!parent) break
    path.unshift(parent.name)
    currentId = parent.parentId
  }

  return path.join(' > ')
}

/**
 * Get folder name by ID
 */
const getFolderName = (folderId: string): string => {
  const folder = mockFolders.find(f => f.id === folderId)
  return folder ? buildFolderPath(folder.id) : ''
}

/**
 * Dashboard types
 */
const dashboardTypes = [
  { value: 'looker', label: 'Looker Dashboard' },
  { value: 'custom', label: 'Custom Dashboard' },
  { value: 'external', label: 'External Link' },
]

/**
 * Initialize form with dashboard data (edit mode) or empty values (create mode)
 */
const initializeForm = () => {
  if (props.dashboard) {
    formData.value = {
      id: props.dashboard.id,
      name: props.dashboard.name,
      description: props.dashboard.description || '',
      type: props.dashboard.type,
      folderId: props.dashboard.folderId,
      lookerDashboardId: props.dashboard.lookerDashboardId || '',
      lookerEmbedUrl: props.dashboard.lookerEmbedUrl || '',
      isArchived: props.dashboard.isArchived,
      owner: props.dashboard.owner,
    }
  } else {
    formData.value = {
      id: `dash_${Date.now()}`,
      name: '',
      description: '',
      type: 'looker',
      folderId: '',
      lookerDashboardId: '',
      lookerEmbedUrl: '',
      isArchived: false,
      owner: authStore.user?.uid || '',
    }
  }
  errors.value = { name: '', type: '', folderId: '', lookerDashboardId: '' }
}

/**
 * Validate form
 */
const validateForm = (): boolean => {
  errors.value = { name: '', type: '', folderId: '', lookerDashboardId: '' }

  // Validate name
  if (!formData.value.name.trim()) {
    errors.value.name = 'ชื่อแดชบอร์ด จำเป็นต้องกรอก'
  }

  // Validate type
  if (!formData.value.type) {
    errors.value.type = 'ประเภทแดชบอร์ด จำเป็นต้องเลือก'
  }

  // Validate folderId
  if (!formData.value.folderId) {
    errors.value.folderId = 'โฟลเดอร์ จำเป็นต้องเลือก'
  }

  // Validate lookerDashboardId if type is 'looker'
  if (formData.value.type === 'looker' && !formData.value.lookerDashboardId.trim()) {
    errors.value.lookerDashboardId = 'Looker Dashboard ID จำเป็นต้องกรอก'
  }

  return (
    !errors.value.name &&
    !errors.value.type &&
    !errors.value.folderId &&
    !errors.value.lookerDashboardId
  )
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

onMounted(() => {
  initializeForm()
})
</script>

<template>
  <form @submit.prevent="handleSubmit" class="dashboard-form">
    <!-- Name Field -->
    <div class="form-group">
      <label for="name" class="form-label">ชื่อแดชบอร์ด *</label>
      <input
        id="name"
        v-model="formData.name"
        type="text"
        class="form-input"
        :class="{ 'form-input--error': errors.name }"
        placeholder="เช่น Regional Sales Performance"
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
        placeholder="คำอธิบายเกี่ยวกับแดชบอร์ด"
        rows="3"
      ></textarea>
    </div>

    <!-- Type Field -->
    <div class="form-group">
      <label for="type" class="form-label">ประเภท *</label>
      <select
        id="type"
        v-model="formData.type"
        class="form-select"
        :class="{ 'form-select--error': errors.type }"
      >
        <option value="">-- เลือกประเภท --</option>
        <option v-for="t in dashboardTypes" :key="t.value" :value="t.value">
          {{ t.label }}
        </option>
      </select>
      <span v-if="errors.type" class="form-error">{{ errors.type }}</span>
    </div>

    <!-- Folder Field -->
    <div class="form-group">
      <label for="folderId" class="form-label">โฟลเดอร์ *</label>
      <select
        id="folderId"
        v-model="formData.folderId"
        class="form-select"
        :class="{ 'form-select--error': errors.folderId }"
      >
        <option value="">-- เลือกโฟลเดอร์ --</option>
        <option v-for="folder in folderOptions" :key="folder.id" :value="folder.id">
          {{ folder.fullPath }}
        </option>
      </select>
      <span v-if="errors.folderId" class="form-error">{{ errors.folderId }}</span>
    </div>

    <!-- Looker Fields (conditional) -->
    <template v-if="formData.type === 'looker'">
      <!-- Looker Dashboard ID -->
      <div class="form-group">
        <label for="lookerId" class="form-label">Looker Dashboard ID *</label>
        <input
          id="lookerId"
          v-model="formData.lookerDashboardId"
          type="text"
          class="form-input"
          :class="{ 'form-input--error': errors.lookerDashboardId }"
          placeholder="เช่น dashboard_123"
        />
        <span v-if="errors.lookerDashboardId" class="form-error">
          {{ errors.lookerDashboardId }}
        </span>
      </div>

      <!-- Looker Embed URL -->
      <div class="form-group">
        <label for="embedUrl" class="form-label">Looker Embed URL</label>
        <input
          id="embedUrl"
          v-model="formData.lookerEmbedUrl"
          type="url"
          class="form-input"
          placeholder="https://looker.example.com/dashboards/123"
        />
      </div>
    </template>

    <!-- Archived Field -->
    <div class="form-group">
      <label class="form-label">สถานะ</label>
      <label class="checkbox">
        <input
          v-model="formData.isArchived"
          type="checkbox"
          class="checkbox__input"
        />
        <span class="checkbox__label">เก็บถาวร (Archived)</span>
      </label>
      <p v-if="formData.isArchived" class="form-hint form-hint--warning">
        แดชบอร์ดที่ถูกเก็บถาวรจะถูกซ่อนจากผู้ใช้ทั่วไป
      </p>
    </div>

    <!-- Info Section -->
    <div v-if="dashboard" class="form-info">
      <div class="info-row">
        <span class="info-label">เจ้าของ:</span>
        <span class="info-value">{{ dashboard.owner }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">สร้างเมื่อ:</span>
        <span class="info-value">{{ formatDate(dashboard.createdAt) }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">แก้ไขล่าสุด:</span>
        <span class="info-value">{{ formatDate(dashboard.updatedAt) }}</span>
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

.form-input--error,
.form-select--error {
  border-color: var(--color-error, #ef4444);
}

.form-input--error:focus,
.form-select--error:focus {
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

.form-hint--warning {
  color: var(--color-warning, #f59e0b);
}

/* Checkbox */
.checkbox {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm, 0.5rem);
  cursor: pointer;
}

.checkbox__input {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--color-primary, #3b82f6);
}

.checkbox__label {
  font-size: 0.95rem;
  color: var(--color-text-primary, #1f2937);
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
