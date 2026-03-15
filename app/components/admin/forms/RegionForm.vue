<script setup lang="ts">
/**
 * RegionForm Component
 * Form for creating and editing regions in admin panel
 *
 * Features:
 * - Fields: Code, Name, Description
 * - Validation: Required fields (code, name)
 * - Code field disabled in edit mode
 * - Uses generic FormField component
 *
 * Usage:
 * <RegionForm
 *   :region="selectedRegion"
 *   @submit="handleSubmit"
 * />
 */

import type { Region } from '~/types/admin'
import { createObjectValidator, validators } from '~/utils/formValidators'

interface Props {
  region?: Region | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  submit: [data: Partial<Region>]
}>()

// Form validation
const validate = createObjectValidator({
  code: [
    (value) => validators.required(value, 'รหัสภูมิภาค'),
    (value) => validators.minLength(2, 'รหัสภูมิภาค')(value),
    (value) => validators.maxLength(20, 'รหัสภูมิภาค')(value),
  ],
  name: [(value) => validators.required(value, 'ชื่อกลุ่มภูมิภาค')],
})

// Destructure to top-level refs so Volar auto-unwraps them in templates correctly
const { formData, errors, handleSubmit, setFieldTouched } = useForm({
  initialValues: {
    code: props.region?.code ?? '',
    name: props.region?.name ?? '',
    description: props.region?.description ?? '',
  },
  validate,
  onSubmit: async (values) => {
    emit('submit', values)
  },
})

const isEditMode = computed(() => !!props.region)

// Expose submit so parent (via ref) can trigger validation + submission
defineExpose({ submit: handleSubmit })
</script>

<template>
  <div class="region-form">
    <FormField
      v-model="formData.code"
      type="text"
      label="รหัสภูมิภาค (Code)"
      placeholder="เช่น NORTH"
      :error="errors.code"
      :disabled="isEditMode"
      :required="true"
      :description="!isEditMode ? 'รหัสภูมิภาค ไม่สามารถเปลี่ยนแปลงหลังสร้างได้' : undefined"
      @blur="setFieldTouched('code')"
    />

    <FormField
      v-model="formData.name"
      type="text"
      label="ชื่อกลุ่มภูมิภาค (Name)"
      placeholder="เช่น กลุ่มภาคเหนือ"
      :error="errors.name"
      :required="true"
      @blur="setFieldTouched('name')"
    />

    <FormField
      v-model="formData.description"
      type="textarea"
      label="คำอธิบาย (Description)"
      placeholder="อธิบายเกี่ยวกับกลุ่มภูมิภาคนี้..."
    />
  </div>
</template>

<style scoped>
.region-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg, 1.5rem);
}
</style>
