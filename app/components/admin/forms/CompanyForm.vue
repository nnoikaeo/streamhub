<script setup lang="ts">
/**
 * CompanyForm Component
 * Form for creating and editing companies in admin panel
 *
 * Features:
 * - Fields: Code, Name, Description, Region, Region Role
 * - Validation: Required fields (code, name)
 * - Code field disabled in edit mode
 * - Region Role shown only when Region is selected
 * - Uses generic FormField component
 *
 * Usage:
 * <CompanyForm
 *   :company="selectedCompany"
 *   :regions="regions"
 *   @submit="handleSubmit"
 * />
 */

import type { Company, Region } from '~/types/admin'
import { createObjectValidator, validators } from '~/utils/formValidators'

interface Props {
  company?: Company | null
  regions?: Region[]
  companies?: Company[]
}

const props = withDefaults(defineProps<Props>(), {
  regions: () => [],
  companies: () => [],
})
const emit = defineEmits<{
  submit: [data: Partial<Company>]
}>()

// Region options from prop
const regionOptions = computed(() => [
  { label: '-- ไม่ระบุ --', value: '' },
  ...props.regions
    .filter(r => r.isActive)
    .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999))
    .map(r => ({ label: r.name, value: r.code })),
])

// Region Role options
const regionRoleOptions = [
  { label: 'Hub — สาขาหลักของกลุ่มธุรกิจ/เขตพื้นที่', value: 'hub' },
  { label: 'Sub — สาขาย่อยภายใต้ Hub', value: 'sub' },
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

/** คำนวณ sortOrder ถัดไปสำหรับ region ที่กำหนด */
const calcNextSortOrder = (regionCode: string) => {
  const sameGroup = props.companies.filter(c => (c.region ?? '') === regionCode)
  return sameGroup.reduce((max, c) => Math.max(max, c.sortOrder ?? 0), 0) + 1
}

// Destructure to top-level refs so Volar auto-unwraps them in templates correctly
const { formData, errors, handleSubmit, setFieldTouched, setFieldValue } = useForm({
  initialValues: {
    code: props.company?.code ?? '',
    name: props.company?.name ?? '',
    description: props.company?.description ?? '',
    region: props.company?.region ?? '',
    regionRole: props.company?.regionRole ?? '',
    sortOrder: props.company?.sortOrder ?? calcNextSortOrder(''),
  },
  validate,
  onSubmit: async (values) => {
    const submitData: Partial<Company> = {
      ...values,
      region: values.region || undefined,
      regionRole: (values.regionRole as 'hub' | 'sub') || undefined,
    }
    emit('submit', submitData)
  },
})

const isEditMode = computed(() => !!props.company)
const hasRegion = computed(() => !!formData.region)

// When region changes: clear regionRole, and auto-update sortOrder in create mode
watch(() => formData.region, (newVal) => {
  if (!newVal) {
    setFieldValue('regionRole', '')
  }
  if (!isEditMode.value) {
    setFieldValue('sortOrder', calcNextSortOrder(newVal ?? ''))
  }
})

// Expose submit so parent (via ref) can trigger validation + submission
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
      v-model="formData.sortOrder"
      type="number"
      label="ลำดับการแสดงผล (Sort Order)"
      placeholder="เช่น 1, 2, 3"
      :disabled="true"
      description="ปรับลำดับได้ด้วยปุ่ม ⬆️ / ⬇️ ในหน้าจัดการบริษัท"
    />

    <!-- Region Section -->
    <div class="region-section">
      <div class="region-section__label">ข้อมูลกลุ่มธุรกิจ/เขตพื้นที่</div>

      <FormField
        v-model="formData.region"
        type="select"
        label="กลุ่มธุรกิจ/เขตพื้นที่ (Region)"
        :options="regionOptions"
      />

      <FormField
        v-if="hasRegion"
        v-model="formData.regionRole"
        type="select"
        label="บทบาทในกลุ่มธุรกิจ/เขตพื้นที่ (Role)"
        :options="regionRoleOptions"
        description="Hub = สาขาหลักของกลุ่มธุรกิจ/เขตพื้นที่, Sub = สาขาย่อยภายใต้ Hub"
      />
    </div>
  </div>
</template>

<style scoped>
.company-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg, 1.5rem);
}

.region-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md, 1rem);
  padding: var(--spacing-md, 1rem);
  border: 1px solid var(--color-border-light, #e5e7eb);
  border-radius: var(--radius-md, 0.375rem);
  background-color: var(--color-bg-secondary, #f9fafb);
}

.region-section__label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-secondary, #6b7280);
  text-transform: uppercase;
  letter-spacing: 0.025em;
}
</style>
