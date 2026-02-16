<script setup lang="ts">
/**
 * ConfirmDialog Component
 * Confirmation modal for destructive actions (delete, archive, etc.)
 *
 * Features:
 * - Warning icon with red theme
 * - Customizable title and message
 * - Danger button styling for confirmation
 * - Prevents closing during loading
 * - Uses Teleport and Transitions (similar to ErrorDialog pattern)
 *
 * Usage:
 * <ConfirmDialog
 *   :is-open="showConfirm"
 *   title="ลบผู้ใช้"
 *   message="คุณแน่ใจว่าต้องการลบผู้ใช้นี้หรือไม่?"
 *   :loading="isDeleting"
 *   @confirm="handleConfirm"
 *   @cancel="showConfirm = false"
 * />
 */

interface Props {
  /**
   * Dialog visibility
   */
  isOpen: boolean

  /**
   * Dialog title
   */
  title: string

  /**
   * Dialog message/description
   */
  message: string

  /**
   * Confirm button text (default: 'ยืนยัน')
   */
  confirmText?: string

  /**
   * Cancel button text (default: 'ยกเลิก')
   */
  cancelText?: string

  /**
   * Is performing action (disable buttons and prevent closing)
   */
  loading?: boolean

  /**
   * Danger level styling (default: false)
   * When true, shows stronger warning styling
   */
  isDanger?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  confirmText: 'ยืนยัน',
  cancelText: 'ยกเลิก',
  loading: false,
  isDanger: true
})

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

/**
 * Handle confirm action
 */
const handleConfirm = () => {
  if (props.loading) return
  emit('confirm')
}

/**
 * Handle cancel/close
 */
const handleCancel = () => {
  if (props.loading) return
  emit('cancel')
}

/**
 * Handle backdrop click
 */
const handleBackdropClick = () => {
  if (props.loading) return
  emit('cancel')
}
</script>

<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="fade">
      <div
        v-if="isOpen"
        class="confirm-backdrop"
        @click="handleBackdropClick"
      />
    </Transition>

    <!-- Dialog -->
    <Transition name="slide-up">
      <div v-if="isOpen" class="confirm-dialog">
        <!-- Warning Icon -->
        <div class="confirm-icon-wrapper" :class="{ 'confirm-icon-wrapper--danger': isDanger }">
          <svg
            class="confirm-icon"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <!-- Warning Triangle -->
            <path
              d="M12 2L2 20h20L12 2z"
              stroke="currentColor"
              stroke-width="2"
              stroke-linejoin="round"
            />
            <!-- Exclamation Mark -->
            <circle cx="12" cy="16" r="1" fill="currentColor" />
            <path d="M12 8V14" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        </div>

        <!-- Title -->
        <h3 class="confirm-title">{{ title }}</h3>

        <!-- Message -->
        <p class="confirm-message">{{ message }}</p>

        <!-- Actions -->
        <div class="confirm-actions">
          <!-- Cancel Button -->
          <button
            type="button"
            class="confirm-button confirm-button--secondary"
            :disabled="loading"
            @click="handleCancel"
          >
            {{ cancelText }}
          </button>

          <!-- Confirm Button -->
          <button
            type="button"
            class="confirm-button confirm-button--danger"
            :disabled="loading"
            @click="handleConfirm"
          >
            <span v-if="loading" class="confirm-spinner"></span>
            {{ loading ? 'กำลังดำเนินการ...' : confirmText }}
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Backdrop */
.confirm-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 40;
}

/* Dialog Container */
.confirm-dialog {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 400px;
  background-color: var(--color-bg-primary, #ffffff);
  border-radius: var(--radius-lg, 0.5rem);
  padding: var(--spacing-2xl, 2rem);
  box-shadow: var(--shadow-2xl, 0 25px 50px -12px rgba(0, 0, 0, 0.25));
  z-index: 50;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md, 1rem);
}

/* Icon Wrapper */
.confirm-icon-wrapper {
  width: 64px;
  height: 64px;
  background-color: rgba(59, 130, 246, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--spacing-md, 1rem);
}

.confirm-icon-wrapper--danger {
  background-color: rgba(239, 68, 68, 0.1);
}

/* Icon */
.confirm-icon {
  width: 36px;
  height: 36px;
  color: var(--color-error, #ef4444);
}

/* Title */
.confirm-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text-primary, #1f2937);
  text-align: center;
  margin: 0;
}

/* Message */
.confirm-message {
  font-size: 0.95rem;
  color: var(--color-text-secondary, #6b7280);
  text-align: center;
  margin: 0;
  line-height: 1.6;
}

/* Actions Container */
.confirm-actions {
  display: flex;
  gap: var(--spacing-sm, 0.5rem);
  width: 100%;
  margin-top: var(--spacing-md, 1rem);
}

/* Button Styles */
.confirm-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm, 0.5rem);
  padding: var(--spacing-md, 0.75rem) var(--spacing-lg, 1rem);
  border-radius: var(--radius-md, 0.375rem);
  font-size: 0.95rem;
  font-weight: 600;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all var(--transition-base, 0.2s ease);
}

.confirm-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Secondary Button (Cancel) */
.confirm-button--secondary {
  background-color: var(--color-bg-secondary, #f3f4f6);
  color: var(--color-text-primary, #1f2937);
  border-color: var(--color-border-light, #e5e7eb);
}

.confirm-button--secondary:not(:disabled):hover {
  background-color: var(--color-border-light, #e5e7eb);
  box-shadow: var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
}

.confirm-button--secondary:not(:disabled):active {
  transform: scale(0.98);
}

/* Danger Button (Confirm) */
.confirm-button--danger {
  background-color: var(--color-error, #ef4444);
  color: white;
}

.confirm-button--danger:not(:disabled):hover {
  background-color: #dc2626;
  box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
}

.confirm-button--danger:not(:disabled):active {
  transform: scale(0.98);
}

/* Loading Spinner */
.confirm-spinner {
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

/* Animations */
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-base, 0.2s ease);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all var(--transition-base, 0.2s ease);
}

.slide-up-enter-from {
  opacity: 0;
  transform: translate(-50%, -40%);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translate(-50%, -40%);
}

/* Responsive */
@media (max-width: 640px) {
  .confirm-dialog {
    width: 95%;
    max-width: 90vw;
    padding: var(--spacing-xl, 1.5rem);
  }

  .confirm-actions {
    flex-direction: column;
  }

  .confirm-button {
    width: 100%;
  }
}
</style>
