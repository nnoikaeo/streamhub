<script setup lang="ts">
/**
 * CompanyForm Component (Refactored)
 * Form for creating and editing companies in admin panel
 *
 * Features:
 * - Fields: Code, Name, Country, Is Active
 * - Validation: Required fields
 * - Code field disabled in edit mode
 * - Uses generic FormField component
 *
 * Usage:
 * <CompanyForm
 *   :company="selectedCompany"
 *   @submit="handleSubmit"
 * />
 */

import type { Company } from '~/composables/useMockData'
import { createObjectValidator, validators } from '~/utils/formValidators'

interface Props {
  company?: Company | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  submit: [data: Partial<Company>]
}>()

// Country options
const countryOptions = [
  { label: 'ประเทศไทย', value: 'Thailand' },
  { label: 'ประเทศลาว', value: 'Laos' },
  { label: 'ประเทศเวียดนาม', value: 'Vietnam' },
  { label: 'ประเทศกัมพูชา', value: 'Cambodia' },
  { label: 'ประเทศพม่า', value: 'Myanmar' },
  { label: 'สิงคโปร์', value: 'Singapore' },
  { label: 'มาเลเซีย', value: 'Malaysia' },
]

// Form validation
const validate = createObjectValidator({
  code: [
    (value) => validators.required(value, 'รหัสบริษัท'),
    (value) => validators.minLength(2, 'รหัสบริษัท')(value),
    (value) => validators.maxLength(10, 'รหัสบริษัท')(value),
  ],
  name: [(value) => validators.required(value, 'ชื่อบริษัท')],
})

const form = useForm({
  initialValues: {
    code: props.company?.code || '',
    name: props.company?.name || '',
    country: props.company?.country || 'Thailand',
    isActive: props.company?.isActive ?? true,
  },
  validate,
  onSubmit: async (values) => {
    emit('submit', values)
  },
})

const isEditMode = computed(() => !!props.company)
</script>

<template>
  <form @submit.prevent="form.handleSubmit" class="company-form">
    <FormField
      v-model="form.formData.code"
      type="text"
      label="รหัสบริษัท (Code)"
      placeholder="เช่น STTH"
      :error="form.errors.code"
      :disabled="isEditMode"
      :required="true"
      :description="!isEditMode ? 'รหัสบริษัท ไม่สามารถเปลี่ยนแปลงหลังสร้างได้' : undefined"
      @blur="form.setFieldTouched('code')"
    />

    <FormField
      v-model="form.formData.name"
      type="text"
      label="ชื่อบริษัท (Name)"
      placeholder="เช่น บริษัท สทรีมวอช (ประเทศไทย) จำกัด"
      :error="form.errors.name"
      :required="true"
      @blur="form.setFieldTouched('name')"
    />

    <FormField
      v-model="form.formData.country"
      type="select"
      label="ประเทศ"
      :options="countryOptions"
    />

    <FormField
      v-model="form.formData.isActive"
      type="checkbox"
      label="เปิดใช้งาน (Active)"
    />

    <p v-if="!form.formData.isActive" class="form-warning">
      บริษัทที่ปิดใช้งานจะไม่สามารถจัดสรรให้ผู้ใช้ใหม่ได้
    </p>
  </form>
</template>

<style scoped>
.company-form {
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
</style>
