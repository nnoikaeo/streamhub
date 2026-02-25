<script setup lang="ts" generic="T extends Record<string, any>">
/**
 * FormModal Component
 * Wraps Modal component for form submission handling
 *
 * Features:
 * - Form submission with validation
 * - Error message display
 * - Loading state during save
 * - Built-in Cancel/Save buttons
 * - Uses existing Modal component for teleport & transitions
 * - Disabled overlay click when loading (prevents closing during save)
 *
 * Usage:
 * <FormModal
 *   v-model="isOpen"
 *   title="Add User"
 *   :loading="isSaving"
 *   @save="handleSave"
 *   @cancel="handleCancel"
 * >
 *   <UserForm :user="selectedUser" />
 * </FormModal>
 */

import { ref, computed } from 'vue'

interface Props {
  /**
   * Modal visibility (v-model)
   */
  modelValue: boolean

  /**
   * Modal title
   */
  title: string

  /**
   * Is form being saved
   */
  loading?: boolean

  /**
   * Modal size (sm, md, lg)
   */
  size?: 'sm' | 'md' | 'lg'

  /**
   * Submit button text (default: 'บันทึก')
   */
  submitText?: string

  /**
   * Cancel button text (default: 'ยกเลิก')
   */
  cancelText?: string
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  size: 'md',
  submitText: 'บันทึก',
  cancelText: 'ยกเลิก'
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: [data?: any]
  cancel: []
}>()

const formRef = ref<HTMLFormElement>()

// Computed to handle modal open state
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

/**
 * Handle form submission
 */
const handleSubmit = async (e: Event) => {
  e.preventDefault()

  if (props.loading) return

  // Get form data if form ref exists
  let formData: any
  if (formRef.value) {
    const fd = new FormData(formRef.value)
    formData = Object.fromEntries(fd)
  }

  emit('save', formData)
}

/**
 * Handle cancel
 */
const handleCancel = () => {
  if (props.loading) return
  emit('cancel')
  emit('update:modelValue', false)
}

/**
 * Handle close button click (prevent closing while loading)
 */
const handleClose = () => {
  if (props.loading) return
  emit('update:modelValue', false)
}
</script>

<template>
  <Modal
    :model-value="isOpen"
    :title="title"
    :size="size"
    :close-on-click-overlay="!loading"
    :close-on-esc="!loading"
    @update:model-value="isOpen = $event"
  >
    <!-- Form Body -->
    <form
      ref="formRef"
      @submit.prevent="handleSubmit"
      class="form-modal__form"
    >
      <!-- Form Content Slot -->
      <slot />
    </form>

    <!-- Form Footer with Actions -->
    <template #footer>
      <div class="form-modal__footer">
        <!-- Cancel Button -->
        <button
          type="button"
          class="form-modal__button form-modal__button--secondary"
          :disabled="loading"
          @click="handleCancel"
        >
          {{ cancelText }}
        </button>

        <!-- Submit Button -->
        <button
          type="submit"
          form="form-modal__form"
          class="form-modal__button form-modal__button--primary"
          :disabled="loading"
          @click="handleSubmit"
        >
          <span v-if="loading" class="form-modal__spinner"></span>
          {{ loading ? 'กำลังบันทึก...' : submitText }}
        </button>
      </div>
    </template>
  </Modal>
</template>

<style scoped>
/* Form Container */
.form-modal__form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md, 1rem);
}

/* Footer Wrapper */
.form-modal__footer {
  display: flex;
  gap: var(--spacing-md, 1rem);
  align-items: center;
  justify-content: flex-end;
}

/* Button Styles */
.form-modal__button {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm, 0.5rem);
  padding: var(--spacing-md, 0.75rem) var(--spacing-lg, 1rem);
  border-radius: var(--radius-md, 0.375rem);
  font-size: 0.95rem;
  font-weight: 600;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all var(--transition-base, 0.2s ease);
}

.form-modal__button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Primary Button (Submit) */
.form-modal__button--primary {
  background-color: var(--color-primary, #3b82f6);
  color: white;
}

.form-modal__button--primary:not(:disabled):hover {
  background-color: var(--color-primary-dark, #2563eb);
  box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
}

.form-modal__button--primary:not(:disabled):active {
  transform: scale(0.98);
}

/* Secondary Button (Cancel) */
.form-modal__button--secondary {
  background-color: transparent;
  color: var(--color-text-secondary, #6b7280);
  border-color: var(--color-border-light, #e5e7eb);
}

.form-modal__button--secondary:not(:disabled):hover {
  background-color: var(--color-bg-secondary, #f3f4f6);
  color: var(--color-text-primary, #1f2937);
}

/* Loading Spinner */
.form-modal__spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Responsive */
@media (max-width: 640px) {
  .form-modal__footer {
    flex-direction: column-reverse;
  }

  .form-modal__button {
    width: 100%;
    justify-content: center;
  }
}
</style>
