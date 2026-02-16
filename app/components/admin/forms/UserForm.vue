<script setup lang="ts">
/**
 * UserForm Component
 * Form for creating and editing users in admin panel
 *
 * Features:
 * - Fields: UID, Email, Display Name, Company, Role, Groups, Is Active
 * - Validation: Required fields, email format
 * - Role dropdown: admin, moderator, user
 * - Company dropdown with active companies only
 * - Multi-select groups
 * - Groups sourced from useMockData
 *
 * Usage:
 * <UserForm
 *   :user="selectedUser"
 *   @submit="handleSubmit"
 * />
 */

import { ref, computed, onMounted } from 'vue'
import type { User } from '~/types/dashboard'
import { mockCompanies, mockGroups } from '~/composables/useMockData'

interface Props {
  /**
   * User to edit (null for create mode)
   */
  user?: User | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  submit: [data: Partial<User>]
}>()

// Form data
const formData = ref({
  uid: '',
  email: '',
  name: '',
  company: 'STTH',
  role: 'user' as const,
  groups: [] as string[],
  isActive: true,
})

// Form errors
const errors = ref({
  uid: '',
  email: '',
  name: '',
})

// Available companies
const companies = computed(() =>
  mockCompanies.filter(c => c.isActive).map(c => ({
    code: c.code,
    label: `${c.code} - ${c.name}`,
  }))
)

// Available groups
const availableGroups = computed(() =>
  Object.entries(mockGroups).map(([key, group]) => ({
    id: key,
    name: group.name,
    description: group.description,
  }))
)

// Available roles
const roles = [
  { value: 'admin', label: 'Admin' },
  { value: 'moderator', label: 'Moderator' },
  { value: 'user', label: 'User' },
]

/**
 * Initialize form with user data (edit mode) or empty values (create mode)
 */
const initializeForm = () => {
  if (props.user) {
    formData.value = {
      uid: props.user.uid,
      email: props.user.email,
      name: props.user.name,
      company: props.user.company,
      role: props.user.role,
      groups: [...props.user.groups],
      isActive: props.user.isActive,
    }
  } else {
    formData.value = {
      uid: '',
      email: '',
      name: '',
      company: 'STTH',
      role: 'user',
      groups: [],
      isActive: true,
    }
  }
  errors.value = { uid: '', email: '', name: '' }
}

/**
 * Validate form
 */
const validateForm = (): boolean => {
  errors.value = { uid: '', email: '', name: '' }

  // Validate UID
  if (!formData.value.uid.trim()) {
    errors.value.uid = 'UID จำเป็นต้องกรอก'
  } else if (formData.value.uid.length < 3) {
    errors.value.uid = 'UID ต้องมีอย่างน้อย 3 ตัวอักษร'
  }

  // Validate email
  if (!formData.value.email.trim()) {
    errors.value.email = 'อีเมล จำเป็นต้องกรอก'
  } else if (!isValidEmail(formData.value.email)) {
    errors.value.email = 'รูปแบบอีเมลไม่ถูกต้อง'
  }

  // Validate name
  if (!formData.value.name.trim()) {
    errors.value.name = 'ชื่อจำเป็นต้องกรอก'
  }

  return !errors.value.uid && !errors.value.email && !errors.value.name
}

/**
 * Simple email validation
 */
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
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
 * Toggle group selection
 */
const toggleGroup = (groupId: string) => {
  const index = formData.value.groups.indexOf(groupId)
  if (index === -1) {
    formData.value.groups.push(groupId)
  } else {
    formData.value.groups.splice(index, 1)
  }
}

/**
 * Check if group is selected
 */
const isGroupSelected = (groupId: string): boolean => {
  return formData.value.groups.includes(groupId)
}

onMounted(() => {
  initializeForm()
})
</script>

<template>
  <form @submit.prevent="handleSubmit" class="user-form">
    <!-- UID Field -->
    <div class="form-group">
      <label for="uid" class="form-label">UID *</label>
      <input
        id="uid"
        v-model="formData.uid"
        type="text"
        class="form-input"
        :class="{ 'form-input--error': errors.uid }"
        placeholder="เช่น user_john_doe"
        :disabled="!!user"
      />
      <span v-if="errors.uid" class="form-error">{{ errors.uid }}</span>
      <p v-if="!user" class="form-hint">UID ไม่สามารถเปลี่ยนแปลงหลังสร้างได้</p>
    </div>

    <!-- Email Field -->
    <div class="form-group">
      <label for="email" class="form-label">อีเมล *</label>
      <input
        id="email"
        v-model="formData.email"
        type="email"
        class="form-input"
        :class="{ 'form-input--error': errors.email }"
        placeholder="user@streamwash.com"
      />
      <span v-if="errors.email" class="form-error">{{ errors.email }}</span>
    </div>

    <!-- Name Field -->
    <div class="form-group">
      <label for="name" class="form-label">ชื่อจริง *</label>
      <input
        id="name"
        v-model="formData.name"
        type="text"
        class="form-input"
        :class="{ 'form-input--error': errors.name }"
        placeholder="เช่น John Doe"
      />
      <span v-if="errors.name" class="form-error">{{ errors.name }}</span>
    </div>

    <!-- Company Field -->
    <div class="form-group">
      <label for="company" class="form-label">บริษัท</label>
      <select v-model="formData.company" class="form-select">
        <option v-for="c in companies" :key="c.code" :value="c.code">
          {{ c.label }}
        </option>
      </select>
    </div>

    <!-- Role Field -->
    <div class="form-group">
      <label for="role" class="form-label">บทบาท</label>
      <select v-model="formData.role" class="form-select">
        <option v-for="r in roles" :key="r.value" :value="r.value">
          {{ r.label }}
        </option>
      </select>
    </div>

    <!-- Groups Field -->
    <div class="form-group">
      <label class="form-label">กลุ่ม</label>
      <div class="groups-container">
        <label
          v-for="group in availableGroups"
          :key="group.id"
          class="group-checkbox"
        >
          <input
            type="checkbox"
            :checked="isGroupSelected(group.id)"
            @change="toggleGroup(group.id)"
            class="group-checkbox__input"
          />
          <span class="group-checkbox__label">{{ group.name }}</span>
          <span class="group-checkbox__description">{{ group.description }}</span>
        </label>
      </div>
    </div>

    <!-- Is Active Field -->
    <div class="form-group">
      <label class="form-label">สถานะ</label>
      <label class="checkbox">
        <input
          v-model="formData.isActive"
          type="checkbox"
          class="checkbox__input"
        />
        <span class="checkbox__label">เปิดใช้งาน (Active)</span>
      </label>
      <p v-if="!formData.isActive" class="form-hint form-hint--warning">
        ผู้ใช้ที่ถูกปิดใช้งานจะไม่สามารถเข้าใช้ระบบได้
      </p>
    </div>
  </form>
</template>

<style scoped>
.user-form {
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

/* Input & Select */
.form-input,
.form-select {
  padding: var(--spacing-sm, 0.5rem) var(--spacing-md, 1rem);
  border: 1px solid var(--color-border-light, #e5e7eb);
  border-radius: var(--radius-md, 0.375rem);
  font-size: 0.95rem;
  background-color: var(--color-bg-primary, #ffffff);
  color: var(--color-text-primary, #1f2937);
  transition: all var(--transition-base, 0.2s ease);
}

.form-input:focus,
.form-select:focus {
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

.form-hint--warning {
  color: var(--color-warning, #f59e0b);
}

/* Groups Container */
.groups-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--spacing-sm, 0.5rem);
  padding: var(--spacing-md, 1rem);
  background-color: var(--color-bg-secondary, #f3f4f6);
  border-radius: var(--radius-md, 0.375rem);
  border: 1px solid var(--color-border-light, #e5e7eb);
}

/* Group Checkbox */
.group-checkbox {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs, 0.25rem);
  padding: var(--spacing-sm, 0.5rem);
  cursor: pointer;
}

.group-checkbox__input {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--color-primary, #3b82f6);
}

.group-checkbox__label {
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--color-text-primary, #1f2937);
}

.group-checkbox__description {
  font-size: 0.8rem;
  color: var(--color-text-secondary, #6b7280);
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

/* Responsive */
@media (max-width: 640px) {
  .groups-container {
    grid-template-columns: 1fr;
  }
}
</style>
