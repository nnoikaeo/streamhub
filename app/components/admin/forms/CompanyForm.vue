<script setup lang="ts">
/**
 * CompanyForm Component
 * Form for creating and editing companies in admin panel
 *
 * Features:
 * - Fields: Code, Name, Is Active
 * - Validation: Required fields, unique code
 * - Code field disabled in edit mode
 *
 * Usage:
 * <CompanyForm
 *   :company="selectedCompany"
 *   @submit="handleSubmit"
 * />
 */

import { ref, onMounted } from 'vue'
import type { Company } from '~/composables/useMockData'

interface Props {
  /**
   * Company to edit (null for create mode)
   */
  company?: Company | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  submit: [data: Partial<Company>]
}>()

// Form data
const formData = ref({
  code: '',
  name: '',
  country: 'Thailand',
  isActive: true,
})

// Form errors
const errors = ref({
  code: '',
  name: '',
})

/**
 * Initialize form with company data (edit mode) or empty values (create mode)
 */
const initializeForm = () => {
  if (props.company) {
    formData.value = {
      code: props.company.code,
      name: props.company.name,
      country: props.company.country || 'Thailand',
      isActive: props.company.isActive,
    }
  } else {
    formData.value = {
      code: '',
      name: '',
      country: 'Thailand',
      isActive: true,
    }
  }
  errors.value = { code: '', name: '' }
}

/**
 * Validate form
 */
const validateForm = (): boolean => {
  errors.value = { code: '', name: '' }

  // Validate code
  if (!formData.value.code.trim()) {
    errors.value.code = 'รหัสบริษัท จำเป็นต้องกรอก'
  } else if (formData.value.code.length < 2) {
    errors.value.code = 'รหัสบริษัท ต้องมีอย่างน้อย 2 ตัวอักษร'
  } else if (formData.value.code.length > 10) {
    errors.value.code = 'รหัสบริษัท ต้องไม่เกิน 10 ตัวอักษร'
  }

  // Validate name
  if (!formData.value.name.trim()) {
    errors.value.name = 'ชื่อบริษัท จำเป็นต้องกรอก'
  }

  return !errors.value.code && !errors.value.name
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

onMounted(() => {
  initializeForm()
})
</script>

<template>
  <form @submit.prevent="handleSubmit" class="company-form">
    <!-- Code Field -->
    <div class="form-group">
      <label for="code" class="form-label">รหัสบริษัท (Code) *</label>
      <input
        id="code"
        v-model="formData.code"
        type="text"
        class="form-input"
        :class="{ 'form-input--error': errors.code }"
        placeholder="เช่น STTH"
        :disabled="!!company"
      />
      <span v-if="errors.code" class="form-error">{{ errors.code }}</span>
      <p v-if="!company" class="form-hint">รหัสบริษัท ไม่สามารถเปลี่ยนแปลงหลังสร้างได้</p>
    </div>

    <!-- Name Field -->
    <div class="form-group">
      <label for="name" class="form-label">ชื่อบริษัท (Name) *</label>
      <input
        id="name"
        v-model="formData.name"
        type="text"
        class="form-input"
        :class="{ 'form-input--error': errors.name }"
        placeholder="เช่น บริษัท สทรีมวอช (ประเทศไทย) จำกัด"
      />
      <span v-if="errors.name" class="form-error">{{ errors.name }}</span>
    </div>

    <!-- Country Field -->
    <div class="form-group">
      <label for="country" class="form-label">ประเทศ</label>
      <select v-model="formData.country" id="country" class="form-select">
        <option value="Thailand">ประเทศไทย</option>
        <option value="Laos">ประเทศลาว</option>
        <option value="Vietnam">ประเทศเวียดนาม</option>
        <option value="Cambodia">ประเทศกัมพูชา</option>
        <option value="Myanmar">ประเทศพม่า</option>
        <option value="Singapore">สิงคโปร์</option>
        <option value="Malaysia">มาเลเซีย</option>
      </select>
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
        บริษัทที่ปิดใช้งานจะไม่สามารถจัดสรรให้ผู้ใช้ใหม่ได้
      </p>
    </div>
  </form>
</template>

<style scoped>
.company-form {
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
</style>
