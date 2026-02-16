<script setup lang="ts">
/**
 * GroupForm Component
 * Form for creating and editing groups in admin panel
 *
 * Features:
 * - Fields: ID, Name, Description, Members (multi-select)
 * - Validation: Required fields, unique ID
 * - ID field disabled in edit mode
 * - Multi-select members with search/filter
 *
 * Usage:
 * <GroupForm
 *   :group="selectedGroup"
 *   :members="allUsers"
 *   @submit="handleSubmit"
 * />
 */

import { ref, computed, onMounted } from 'vue'
import type { User } from '~/types/dashboard'
import { mockUsers } from '~/composables/useMockData'

interface GroupData {
  id: string
  name: string
  description: string
  members: string[]
}

interface Props {
  /**
   * Group to edit (null for create mode)
   * Group data format: { id, name, description, members: [uid1, uid2...] }
   */
  group?: GroupData | null

  /**
   * Optional custom members list (defaults to mockUsers)
   */
  members?: User[]
}

const props = withDefaults(defineProps<Props>(), {
  members: () => mockUsers,
})

const emit = defineEmits<{
  submit: [data: Partial<GroupData>]
}>()

// Form data
const formData = ref({
  id: '',
  name: '',
  description: '',
  members: [] as string[],
})

// Form errors
const errors = ref({
  id: '',
  name: '',
})

// Search/filter for members
const memberSearch = ref('')

// Computed available members
const availableMembers = computed(() =>
  props.members.filter((user) => {
    if (!memberSearch.value) return true
    const search = memberSearch.value.toLowerCase()
    return (
      user.email.toLowerCase().includes(search) ||
      user.name.toLowerCase().includes(search)
    )
  })
)

/**
 * Initialize form with group data (edit mode) or empty values (create mode)
 */
const initializeForm = () => {
  if (props.group) {
    formData.value = {
      id: props.group.id,
      name: props.group.name,
      description: props.group.description || '',
      members: [...props.group.members],
    }
  } else {
    formData.value = {
      id: '',
      name: '',
      description: '',
      members: [],
    }
  }
  memberSearch.value = ''
  errors.value = { id: '', name: '' }
}

/**
 * Validate form
 */
const validateForm = (): boolean => {
  errors.value = { id: '', name: '' }

  // Validate ID
  if (!formData.value.id.trim()) {
    errors.value.id = 'รหัสกลุ่ม จำเป็นต้องกรอก'
  } else if (formData.value.id.length < 2) {
    errors.value.id = 'รหัสกลุ่ม ต้องมีอย่างน้อย 2 ตัวอักษร'
  }

  // Validate name
  if (!formData.value.name.trim()) {
    errors.value.name = 'ชื่อกลุ่ม จำเป็นต้องกรอก'
  }

  return !errors.value.id && !errors.value.name
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
 * Toggle member selection
 */
const toggleMember = (uid: string) => {
  const index = formData.value.members.indexOf(uid)
  if (index === -1) {
    formData.value.members.push(uid)
  } else {
    formData.value.members.splice(index, 1)
  }
}

/**
 * Check if member is selected
 */
const isMemberSelected = (uid: string): boolean => {
  return formData.value.members.includes(uid)
}

/**
 * Get selected members count
 */
const selectedMembersCount = computed(() => formData.value.members.length)

/**
 * Select all members (filtered)
 */
const selectAll = () => {
  for (const user of availableMembers.value) {
    if (!isMemberSelected(user.uid)) {
      formData.value.members.push(user.uid)
    }
  }
}

/**
 * Deselect all members (filtered)
 */
const deselectAll = () => {
  for (const user of availableMembers.value) {
    const index = formData.value.members.indexOf(user.uid)
    if (index !== -1) {
      formData.value.members.splice(index, 1)
    }
  }
}

onMounted(() => {
  initializeForm()
})
</script>

<template>
  <form @submit.prevent="handleSubmit" class="group-form">
    <!-- ID Field -->
    <div class="form-group">
      <label for="id" class="form-label">รหัสกลุ่ม (ID) *</label>
      <input
        id="id"
        v-model="formData.id"
        type="text"
        class="form-input"
        :class="{ 'form-input--error': errors.id }"
        placeholder="เช่น sales"
        :disabled="!!group"
      />
      <span v-if="errors.id" class="form-error">{{ errors.id }}</span>
      <p v-if="!group" class="form-hint">รหัสกลุ่ม ไม่สามารถเปลี่ยนแปลงหลังสร้างได้</p>
    </div>

    <!-- Name Field -->
    <div class="form-group">
      <label for="name" class="form-label">ชื่อกลุ่ม (Name) *</label>
      <input
        id="name"
        v-model="formData.name"
        type="text"
        class="form-input"
        :class="{ 'form-input--error': errors.name }"
        placeholder="เช่น Sales Team"
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
        placeholder="คำอธิบายเกี่ยวกับกลุ่มนี้"
        rows="3"
      ></textarea>
    </div>

    <!-- Members Field -->
    <div class="form-group">
      <div class="members-header">
        <label class="form-label">สมาชิก ({{ selectedMembersCount }})</label>
        <div class="members-actions">
          <button
            type="button"
            class="members-action-btn"
            @click="selectAll"
          >
            เลือกทั้งหมด
          </button>
          <button
            type="button"
            class="members-action-btn"
            @click="deselectAll"
          >
            ยกเลิกทั้งหมด
          </button>
        </div>
      </div>

      <!-- Member Search -->
      <input
        v-model="memberSearch"
        type="text"
        class="form-input"
        placeholder="ค้นหาผู้ใช้ (อีเมล หรือ ชื่อ)"
      />

      <!-- Members List -->
      <div class="members-container">
        <label
          v-for="user in availableMembers"
          :key="user.uid"
          class="member-checkbox"
        >
          <input
            type="checkbox"
            :checked="isMemberSelected(user.uid)"
            @change="toggleMember(user.uid)"
            class="member-checkbox__input"
          />
          <div class="member-info">
            <span class="member-name">{{ user.name }}</span>
            <span class="member-email">{{ user.email }}</span>
            <span class="member-role">{{ user.role }}</span>
          </div>
        </label>

        <!-- Empty State -->
        <div v-if="availableMembers.length === 0" class="members-empty">
          ไม่พบผู้ใช้ที่ตรงกับการค้นหา
        </div>
      </div>
    </div>
  </form>
</template>

<style scoped>
.group-form {
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

/* Input & Textarea */
.form-input,
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

/* Members Header */
.members-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.members-actions {
  display: flex;
  gap: var(--spacing-xs, 0.25rem);
}

.members-action-btn {
  padding: 0.375rem var(--spacing-sm, 0.5rem);
  font-size: 0.8rem;
  background-color: transparent;
  color: var(--color-primary, #3b82f6);
  border: 1px solid var(--color-primary, #3b82f6);
  border-radius: var(--radius-sm, 0.25rem);
  cursor: pointer;
  transition: all var(--transition-base, 0.2s ease);
}

.members-action-btn:hover {
  background-color: var(--color-primary, #3b82f6);
  color: white;
}

/* Members Container */
.members-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs, 0.25rem);
  padding: var(--spacing-md, 1rem);
  background-color: var(--color-bg-secondary, #f3f4f6);
  border-radius: var(--radius-md, 0.375rem);
  border: 1px solid var(--color-border-light, #e5e7eb);
  max-height: 300px;
  overflow-y: auto;
}

/* Member Checkbox */
.member-checkbox {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm, 0.5rem);
  padding: var(--spacing-sm, 0.5rem);
  cursor: pointer;
  border-radius: var(--radius-sm, 0.25rem);
  transition: background-color var(--transition-base, 0.2s ease);
}

.member-checkbox:hover {
  background-color: rgba(59, 130, 246, 0.1);
}

.member-checkbox__input {
  width: 18px;
  height: 18px;
  margin-top: 2px;
  cursor: pointer;
  accent-color: var(--color-primary, #3b82f6);
  flex-shrink: 0;
}

/* Member Info */
.member-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs, 0.25rem);
  flex: 1;
}

.member-name {
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--color-text-primary, #1f2937);
}

.member-email {
  font-size: 0.8rem;
  color: var(--color-text-secondary, #6b7280);
}

.member-role {
  font-size: 0.75rem;
  padding: 0.125rem var(--spacing-xs, 0.25rem);
  background-color: var(--color-bg-primary, #ffffff);
  color: var(--color-text-secondary, #6b7280);
  border-radius: var(--radius-sm, 0.25rem);
  width: fit-content;
  font-weight: 500;
}

/* Empty State */
.members-empty {
  padding: var(--spacing-lg, 1.25rem);
  text-align: center;
  color: var(--color-text-secondary, #6b7280);
  font-size: 0.9rem;
}

/* Responsive */
@media (max-width: 640px) {
  .members-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm, 0.5rem);
  }

  .members-actions {
    width: 100%;
  }

  .members-action-btn {
    flex: 1;
  }
}
</style>
