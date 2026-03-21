<script setup lang="ts" generic="T extends Record<string, any>">
/**
 * FormModal Component
 * Wraps Modal component for form submission handling
 *
 * Features:
 * - Form submission with validation
 * - Loading state during save
 * - Built-in Cancel/Save buttons using theme-btn classes
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
  /** Modal visibility (v-model) */
  modelValue: boolean
  /** Modal title */
  title: string
  /** Is form being saved */
  loading?: boolean
  /** Modal size (sm, md, lg, xl) */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Submit button text */
  submitText?: string
  /** Cancel button text */
  cancelText?: string
  /** Disable submit button (e.g. after successful submission) */
  submitDisabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  size: 'md',
  submitText: 'บันทึก',
  cancelText: 'ยกเลิก',
  submitDisabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: [data?: any]
  cancel: []
}>()

const formRef = ref<HTMLFormElement>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const handleSubmit = async (e: Event) => {
  e.preventDefault()
  if (props.loading || props.submitDisabled) return

  let formData: any
  if (formRef.value) {
    const fd = new FormData(formRef.value)
    formData = Object.fromEntries(fd)
  }

  emit('save', formData)
}

const handleCancel = () => {
  if (props.loading) return
  emit('cancel')
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
    <form ref="formRef" class="form-modal__form" @submit.prevent="handleSubmit">
      <slot />
    </form>

    <!-- Footer with Cancel / Save -->
    <template #footer>
      <div class="form-modal__footer">
        <button
          type="button"
          class="theme-btn theme-btn--secondary"
          :disabled="loading"
          @click="handleCancel"
        >
          {{ cancelText }}
        </button>

        <button
          type="submit"
          class="theme-btn theme-btn--primary"
          :disabled="loading || submitDisabled"
          @click="handleSubmit"
        >
          <span v-if="loading" class="form-modal__spinner" />
          {{ loading ? 'กำลังบันทึก...' : submitText }}
        </button>
      </div>
    </template>
  </Modal>
</template>

<style scoped>
.form-modal__form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md, 1rem);
}

.form-modal__footer {
  display: flex;
  gap: var(--spacing-md, 1rem);
  align-items: center;
  justify-content: flex-end;
}

.form-modal__spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-right: var(--spacing-xs, 0.25rem);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 640px) {
  .form-modal__footer {
    flex-direction: column-reverse;
  }

  .theme-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
