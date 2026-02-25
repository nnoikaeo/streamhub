<script setup lang="ts">
/**
 * UserForm Component (Refactored)
 * Form for creating and editing users in admin panel
 *
 * Features:
 * - Fields: UID, Email, Display Name, Company, Role, Groups, Is Active
 * - Validation: Required fields, email format
 * - Uses FormField component for consistent styling
 */

import type { User } from '~/types/dashboard'
import { useAdminCompanies } from '~/composables/useAdminCompanies'
import { useAdminGroups } from '~/composables/useAdminGroups'
import { createObjectValidator, validators, composeValidators } from '~/utils/formValidators'
import { onMounted } from 'vue'

interface Props {
  user?: User | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  submit: [data: Partial<User>]
}>()

// Composables
const { companies, fetchCompanies } = useAdminCompanies()
const { groups, fetchGroups } = useAdminGroups()

// Role options
const roleOptions = [
  { label: 'Admin', value: 'admin' },
  { label: 'Moderator', value: 'moderator' },
  { label: 'User', value: 'user' },
]

// Company options
const companyOptions = computed(() =>
  companies.value.filter(c => c.isActive).map(c => ({
    label: `${c.code} - ${c.name}`,
    value: c.code,
  }))
)

// Group options
const groupOptions = computed(() =>
  groups.value.map(g => ({
    label: g.name,
    value: g.id,
  }))
)

// Form validation
const validate = createObjectValidator({
  uid: [
    (value) => validators.required(value, 'UID'),
    (value) => validators.minLength(3, 'UID')(value),
  ],
  email: [
    (value) => validators.required(value, 'อีเมล'),
    (value) => validators.email(value),
  ],
  name: [(value) => validators.required(value, 'ชื่อ')],
})

const form = useForm({
  initialValues: {
    uid: props.user?.uid || '',
    email: props.user?.email || '',
    name: props.user?.name || '',
    company: props.user?.company || 'STTH',
    role: props.user?.role || 'user',
    groups: props.user?.groups || [],
    isActive: props.user?.isActive ?? true,
  },
  validate,
  onSubmit: async (values) => {
    emit('submit', values)
  },
})

const isEditMode = computed(() => !!props.user)

// Fetch companies and groups on mount
onMounted(async () => {
  await Promise.all([fetchCompanies(), fetchGroups()])
})

// Group selection helpers
const toggleGroup = (groupId: string) => {
  const groups = form.formData.groups as string[]
  const index = groups.indexOf(groupId)
  if (index === -1) {
    groups.push(groupId)
  } else {
    groups.splice(index, 1)
  }
}

const isGroupSelected = (groupId: string): boolean => {
  return (form.formData.groups as string[]).includes(groupId)
}
</script>

<template>
  <form @submit.prevent="form.handleSubmit" class="user-form">
    <FormField
      v-model="form.formData.uid"
      type="text"
      label="UID"
      placeholder="เช่น user_john_doe"
      :error="form.errors.uid"
      :disabled="isEditMode"
      :required="true"
      :description="!isEditMode ? 'UID ไม่สามารถเปลี่ยนแปลงหลังสร้างได้' : undefined"
      @blur="form.setFieldTouched('uid')"
    />

    <FormField
      v-model="form.formData.email"
      type="email"
      label="อีเมล"
      placeholder="user@streamwash.com"
      :error="form.errors.email"
      :required="true"
      @blur="form.setFieldTouched('email')"
    />

    <FormField
      v-model="form.formData.name"
      type="text"
      label="ชื่อจริง"
      placeholder="เช่น John Doe"
      :error="form.errors.name"
      :required="true"
      @blur="form.setFieldTouched('name')"
    />

    <FormField
      v-model="form.formData.company"
      type="select"
      label="บริษัท"
      :options="companyOptions"
    />

    <FormField
      v-model="form.formData.role"
      type="select"
      label="บทบาท"
      :options="roleOptions"
    />

    <!-- Groups Field (Custom) -->
    <div class="form-field">
      <label class="form-label">กลุ่ม</label>
      <div class="groups-container">
        <label v-for="group in groupOptions" :key="group.value" class="group-checkbox">
          <input
            type="checkbox"
            :checked="isGroupSelected(group.value)"
            @change="toggleGroup(group.value)"
            class="group-checkbox__input"
          />
          <span class="group-checkbox__label">{{ group.label }}</span>
        </label>
      </div>
    </div>

    <FormField
      v-model="form.formData.isActive"
      type="checkbox"
      label="เปิดใช้งาน (Active)"
    />

    <p v-if="!form.formData.isActive" class="form-warning">
      ผู้ใช้ที่ถูกปิดใช้งานจะไม่สามารถเข้าใช้ระบบได้
    </p>
  </form>
</template>

<style scoped>
.user-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg, 1.25rem);
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs, 0.25rem);
}

.form-label {
  font-weight: 600;
  font-size: 0.9375rem;
  color: var(--color-text-primary, #1f2937);
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
