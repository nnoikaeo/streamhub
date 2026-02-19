<script setup lang="ts">
/**
 * Generic Form Field Component
 *
 * Supports multiple input types with unified styling and validation
 * Used across all admin forms for consistency
 *
 * Types: text, email, number, select, textarea, checkbox, multi-select
 */

interface Props {
  modelValue: string | number | boolean | string[]
  type?: 'text' | 'email' | 'number' | 'select' | 'textarea' | 'checkbox' | 'multi-select'
  label?: string
  placeholder?: string
  error?: string
  required?: boolean
  disabled?: boolean
  options?: Array<{ label: string; value: string | number }>
  rows?: number // For textarea
  description?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  rows: 3,
})

const emit = defineEmits<{
  'update:modelValue': [value: any]
  blur: []
  focus: []
}>()

const inputValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const isFieldError = computed(() => !!props.error)
const fieldId = computed(() => `field-${Math.random().toString(36).substr(2, 9)}`)
</script>

<template>
  <div class="form-field">
    <!-- Label -->
    <label v-if="label" :for="fieldId" class="form-label">
      {{ label }}
      <span v-if="required" class="required-badge">*</span>
    </label>

    <!-- Text Input -->
    <input
      v-if="type === 'text' || type === 'email' || type === 'number'"
      :id="fieldId"
      v-model="inputValue"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled"
      :aria-invalid="isFieldError"
      :aria-describedby="error ? `${fieldId}-error` : undefined"
      class="form-input"
      :class="{ 'form-input--error': isFieldError }"
      @blur="$emit('blur')"
      @focus="$emit('focus')"
    />

    <!-- Textarea -->
    <textarea
      v-else-if="type === 'textarea'"
      :id="fieldId"
      v-model="inputValue"
      :placeholder="placeholder"
      :rows="rows"
      :disabled="disabled"
      :aria-invalid="isFieldError"
      :aria-describedby="error ? `${fieldId}-error` : undefined"
      class="form-input form-textarea"
      :class="{ 'form-input--error': isFieldError }"
      @blur="$emit('blur')"
      @focus="$emit('focus')"
    />

    <!-- Select -->
    <select
      v-else-if="type === 'select'"
      :id="fieldId"
      v-model="inputValue"
      :disabled="disabled"
      :aria-invalid="isFieldError"
      :aria-describedby="error ? `${fieldId}-error` : undefined"
      class="form-input form-select"
      :class="{ 'form-input--error': isFieldError }"
      @blur="$emit('blur')"
      @focus="$emit('focus')"
    >
      <option value="">-- {{ placeholder || 'เลือก' }} --</option>
      <option v-for="opt in options" :key="opt.value" :value="opt.value">
        {{ opt.label }}
      </option>
    </select>

    <!-- Checkbox -->
    <div v-else-if="type === 'checkbox'" class="form-checkbox-wrapper">
      <input
        :id="fieldId"
        v-model="inputValue"
        type="checkbox"
        :disabled="disabled"
        :aria-invalid="isFieldError"
        class="form-checkbox"
      />
      <label :for="fieldId" class="form-checkbox-label">{{ label }}</label>
    </div>

    <!-- Multi-Select -->
    <div v-else-if="type === 'multi-select'" class="form-multi-select">
      <div
        v-for="opt in options"
        :key="opt.value"
        class="form-multi-select-item"
      >
        <input
          :id="`${fieldId}-${opt.value}`"
          :checked="Array.isArray(inputValue) && inputValue.includes(opt.value)"
          type="checkbox"
          :disabled="disabled"
          @change="
            (e: any) => {
              const arr = Array.isArray(inputValue) ? [...inputValue] : []
              if (e.target.checked) {
                arr.push(opt.value)
              } else {
                arr.splice(arr.indexOf(opt.value), 1)
              }
              emit('update:modelValue', arr)
            }
          "
          class="form-checkbox"
        />
        <label :for="`${fieldId}-${opt.value}`" class="form-checkbox-label">
          {{ opt.label }}
        </label>
      </div>
    </div>

    <!-- Description -->
    <p v-if="description && !error" class="form-description">
      {{ description }}
    </p>

    <!-- Error Message -->
    <p v-if="error" :id="`${fieldId}-error`" class="form-error">
      {{ error }}
    </p>
  </div>
</template>

<style scoped>
.form-field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs, 0.25rem);
  margin-bottom: var(--spacing-lg, 1.25rem);
}

.form-label {
  font-weight: 600;
  font-size: 0.9375rem;
  color: var(--color-text-primary, #1f2937);
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.required-badge {
  color: var(--color-error, #ef4444);
}

.form-input,
.form-select,
.form-textarea,
.form-checkbox {
  padding: var(--spacing-sm, 0.5rem) var(--spacing-md, 1rem);
  border: 1px solid var(--color-border-light, #e5e7eb);
  border-radius: var(--radius-md, 0.375rem);
  font-size: 0.9375rem;
  background-color: var(--color-bg-primary, #ffffff);
  color: var(--color-text-primary, #1f2937);
  transition: all var(--transition-base, 0.2s ease);
  font-family: inherit;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--color-primary, #3b82f6);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input:disabled,
.form-select:disabled,
.form-textarea:disabled,
.form-checkbox:disabled {
  background-color: var(--color-bg-secondary, #f3f4f6);
  color: var(--color-text-secondary, #6b7280);
  cursor: not-allowed;
}

.form-input--error,
.form-input--error:focus,
.form-select--error,
.form-select--error:focus,
.form-textarea--error,
.form-textarea--error:focus {
  border-color: var(--color-error, #ef4444);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.form-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.5rem center;
  background-size: 1.25rem 1.25rem;
  padding-right: 2.5rem;
}

.form-checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm, 0.5rem);
  margin-bottom: var(--spacing-lg, 1.25rem);
}

.form-checkbox {
  width: 1.125rem;
  height: 1.125rem;
  cursor: pointer;
  accent-color: var(--color-primary, #3b82f6);
}

.form-checkbox:disabled {
  accent-color: var(--color-border-light, #e5e7eb);
}

.form-checkbox-label {
  cursor: pointer;
  user-select: none;
  font-weight: normal;
}

.form-multi-select {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm, 0.5rem);
  padding: var(--spacing-md, 1rem);
  background-color: var(--color-bg-secondary, #f3f4f6);
  border: 1px solid var(--color-border-light, #e5e7eb);
  border-radius: var(--radius-md, 0.375rem);
  max-height: 200px;
  overflow-y: auto;
}

.form-multi-select-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm, 0.5rem);
}

.form-description {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--color-text-secondary, #6b7280);
  font-style: italic;
}

.form-error {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--color-error, #ef4444);
  font-weight: 500;
}
</style>
