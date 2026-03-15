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
  nextSortOrder?: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  submit: [data: Partial<Region>]
}>()

// Form validation
const validate = createObjectValidator({
  code: [
    (value) => validators.required(value, 'รหัสกลุ่มธุรกิจ/เขตพื้นที่'),
    (value) => validators.minLength(2, 'รหัสกลุ่มธุรกิจ/เขตพื้นที่')(value),
    (value) => validators.maxLength(20, 'รหัสกลุ่มธุรกิจ/เขตพื้นที่')(value),
  ],
  name: [(value) => validators.required(value, 'ชื่อกลุ่มธุรกิจ/เขตพื้นที่')],
})

// Destructure to top-level refs so Volar auto-unwraps them in templates correctly
const { formData, errors, handleSubmit, setFieldTouched } = useForm({
  initialValues: {
    code: props.region?.code ?? '',
    name: props.region?.name ?? '',
    description: props.region?.description ?? '',
    sortOrder: props.region?.sortOrder ?? props.nextSortOrder ?? 0,
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
      label="รหัสกลุ่มธุรกิจ/เขตพื้นที่ (Code)"
      placeholder="เช่น NORTH"
      :error="errors.code"
      :disabled="isEditMode"
      :required="true"
      :description="!isEditMode ? 'รหัสกลุ่มธุรกิจ/เขตพื้นที่ ไม่สามารถเปลี่ยนแปลงหลังสร้างได้' : undefined"
      @blur="setFieldTouched('code')"
    />

    <FormField
      v-model="formData.name"
      type="text"
      label="ชื่อกลุ่มธุรกิจ/เขตพื้นที่ (Name)"
      placeholder="เช่น กลุ่มภาคเหนือ"
      :error="errors.name"
      :required="true"
      @blur="setFieldTouched('name')"
    />

    <FormField
      v-model="formData.description"
      type="textarea"
      label="คำอธิบาย (Description)"
      placeholder="อธิบายเกี่ยวกับกลุ่มธุรกิจ/เขตพื้นที่นี้..."
    />

    <FormField
      v-model="formData.sortOrder"
      type="number"
      label="ลำดับการแสดงผล (Sort Order)"
      placeholder="เช่น 1, 2, 3"
      :disabled="true"
      description="ปรับลำดับได้ด้วยปุ่ม ⬆️ / ⬇️ ในหน้าจัดการกลุ่มธุรกิจ/เขตพื้นที่"
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
