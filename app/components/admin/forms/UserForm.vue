<script setup lang="ts">
/**
 * UserForm Component (Refactored)
 * Form for creating and editing users in admin panel
 *
 * Features:
 * - Fields: UID, Email, Display Name, Company, Role
 * - Validation: Required fields, email format
 * - Uses FormField component for consistent styling
 * - Groups and isActive are managed separately (toggle switch / groups page)
 */

import type { User } from '~/types/dashboard'
import { useAdminCompanies } from '~/composables/useAdminCompanies'
import { createObjectValidator, validators } from '~/utils/formValidators'
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

const { formData, errors, handleSubmit, setFieldTouched } = useForm({
  initialValues: {
    uid: props.user?.uid || '',
    email: props.user?.email || '',
    name: props.user?.name || '',
    company: props.user?.company || 'STTH',
    role: props.user?.role || 'user',
  },
  validate,
  onSubmit: async (values) => {
    emit('submit', values)
  },
})

const isEditMode = computed(() => !!props.user)

// Fetch companies on mount
onMounted(async () => {
  await fetchCompanies()
})

defineExpose({ submit: handleSubmit })
</script>

<template>
  <div class="user-form">
    <FormField
      v-model="formData.uid"
      type="text"
      label="UID"
      placeholder="เช่น user_john_doe"
      :error="errors.uid"
      :disabled="isEditMode"
      :required="true"
      :description="!isEditMode ? 'UID ไม่สามารถเปลี่ยนแปลงหลังสร้างได้' : undefined"
      @blur="setFieldTouched('uid')"
    />

    <FormField
      v-model="formData.email"
      type="email"
      label="อีเมล"
      placeholder="user@streamwash.com"
      :error="errors.email"
      :required="true"
      @blur="setFieldTouched('email')"
    />

    <FormField
      v-model="formData.name"
      type="text"
      label="ชื่อจริง"
      placeholder="เช่น John Doe"
      :error="errors.name"
      :required="true"
      @blur="setFieldTouched('name')"
    />

    <FormField
      v-model="formData.company"
      type="select"
      label="บริษัท"
      :options="companyOptions"
    />

    <FormField
      v-model="formData.role"
      type="select"
      label="บทบาท"
      :options="roleOptions"
    />
  </div>
</template>

<style scoped>
.user-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg, 1.25rem);
}
</style>
