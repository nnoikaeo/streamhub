<script setup lang="ts">
/**
 * CompanyForm Component
 * Form for creating and editing companies in admin panel
 *
 * Features:
 * - Fields: Code, Name, Description, Country, Is Active
 * - Validation: Required fields (code, name)
 * - Code field disabled in edit mode
 * - Uses generic FormField component
 *
 * Usage:
 * <CompanyForm
 *   :company="selectedCompany"
 *   @submit="handleSubmit"
 * />
 */

import type { Company } from '~/types/admin'
import { createObjectValidator, validators } from '~/utils/formValidators'

interface Props {
  company?: Company | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  submit: [data: Partial<Company>]
}>()

// Country options — value ต้องตรงกับที่เก็บใน .data/companies.json
const countryOptions = [
  { label: 'ประเทศไทย', value: 'ประเทศไทย' },
  { label: 'ประเทศลาว', value: 'ประเทศลาว' },
  { label: 'ประเทศเวียดนาม', value: 'ประเทศเวียดนาม' },
  { label: 'ประเทศกัมพูชา', value: 'ประเทศกัมพูชา' },
  { label: 'ประเทศพม่า', value: 'ประเทศพม่า' },
  { label: 'สิงคโปร์', value: 'สิงคโปร์' },
  { label: 'มาเลเซีย', value: 'มาเลเซีย' },
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

// Destructure to top-level refs so Volar auto-unwraps them in templates correctly
const { formData, errors, handleSubmit, setFieldTouched } = useForm({
  initialValues: {
    code: props.company?.code ?? '',
    name: props.company?.name ?? '',
    description: props.company?.description ?? '',
    country: props.company?.country ?? 'ประเทศไทย',
  },
  validate,
  onSubmit: async (values) => {
    emit('submit', values)
  },
})

const isEditMode = computed(() => !!props.company)

// Expose submit so parent (via ref) can trigger validation + submission
// This avoids nested <form> (invalid HTML) and DOM FormData issues
defineExpose({ submit: handleSubmit })
</script>

<template>
  <div class="company-form">
    <FormField
      v-model="formData.code"
      type="text"
      label="รหัสบริษัท (Code)"
      placeholder="เช่น STTH"
      :error="errors.code"
      :disabled="isEditMode"
      :required="true"
      :description="!isEditMode ? 'รหัสบริษัท ไม่สามารถเปลี่ยนแปลงหลังสร้างได้' : undefined"
      @blur="setFieldTouched('code')"
    />

    <FormField
      v-model="formData.name"
      type="text"
      label="ชื่อบริษัท (Name)"
      placeholder="เช่น บริษัท สทรีมวอช (ประเทศไทย) จำกัด"
      :error="errors.name"
      :required="true"
      @blur="setFieldTouched('name')"
    />

    <FormField
      v-model="formData.description"
      type="textarea"
      label="คำอธิบาย (Description)"
      placeholder="อธิบายเกี่ยวกับบริษัทนี้..."
    />

    <FormField
      v-model="formData.country"
      type="select"
      label="ประเทศ"
      :options="countryOptions"
    />

  </div>
</template>

<style scoped>
.company-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg, 1.5rem);
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
