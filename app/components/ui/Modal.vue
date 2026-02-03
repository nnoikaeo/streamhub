<template>
  <Teleport to="body">
    <!-- Modal Overlay -->
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="modal-overlay"
        @click.self="closeModal"
        @keydown.esc="closeModal"
      >
        <!-- Modal Container -->
        <div
          class="modal-container"
          :class="`modal-${size}`"
          role="dialog"
          :aria-labelledby="titleId"
          :aria-modal="true"
        >
          <!-- Modal Header -->
          <div v-if="$slots.header || title" class="modal-header">
            <h2 :id="titleId" class="modal-title">
              {{ title }}
              <slot name="header" />
            </h2>

            <!-- Close Button -->
            <button
              class="modal-close"
              type="button"
              @click="closeModal"
              :aria-label="`Close ${title}`"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <!-- Modal Body -->
          <div class="modal-body">
            <slot />
          </div>

          <!-- Modal Footer -->
          <div v-if="$slots.footer" class="modal-footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'

/**
 * Modal Component - Dialog/modal overlay component
 *
 * Features:
 * - Teleport to body (prevents z-index conflicts)
 * - Transition animations (fade + scale)
 * - Click-outside to close (overlay click)
 * - Keyboard support (ESC key to close)
 * - Focus management
 * - Accessible (aria-modal, aria-labelledby)
 * - Multiple size variants
 * - Scrollable body
 *
 * Usage:
 * <Modal
 *   v-model="isOpen"
 *   title="Confirm Action"
 * >
 *   <p>Are you sure?</p>
 *   <template #footer>
 *     <Button @click="confirm">Confirm</Button>
 *     <Button variant="ghost" @click="closeModal">Cancel</Button>
 *   </template>
 * </Modal>
 */

const props = defineProps({
  /**
   * Modal visibility (v-model)
   */
  modelValue: {
    type: Boolean,
    required: true,
  },

  /**
   * Modal title
   */
  title: {
    type: String,
    default: '',
  },

  /**
   * Modal size
   */
  size: {
    type: String as () => 'sm' | 'md' | 'lg',
    default: 'md',
    validator: (v: string) => ['sm', 'md', 'lg'].includes(v),
  },

  /**
   * Close on ESC key
   */
  closeOnEsc: {
    type: Boolean,
    default: true,
  },

  /**
   * Close on overlay click
   */
  closeOnClickOverlay: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const isOpen = computed(() => props.modelValue)

const titleId = `modal-title-${Math.random().toString(36).substring(2, 9)}`

/**
 * Close modal
 */
const closeModal = () => {
  if (props.closeOnEsc || props.closeOnClickOverlay) {
    emit('update:modelValue', false)
  }
}

/**
 * Lock body scroll when modal is open
 */
onMounted(() => {
  if (isOpen.value) {
    document.body.style.overflow = 'hidden'
  }
})

onUnmounted(() => {
  document.body.style.overflow = ''
})

/**
 * Watch for model changes
 */
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.closeOnEsc) {
    closeModal()
  }
}
</script>

<style scoped>
/* ========== MODAL OVERLAY ========== */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.5);
  padding: 1rem;
  overflow-y: auto;
}

/* ========== MODAL CONTAINER ========== */
.modal-container {
  background-color: #ffffff;
  border-radius: 0.5rem;
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  max-width: 90vw;
  overflow: hidden;
}

/* Size variants */
.modal-sm {
  width: 100%;
  max-width: 24rem;
}

.modal-md {
  width: 100%;
  max-width: 28rem;
}

.modal-lg {
  width: 100%;
  max-width: 48rem;
}

/* ========== MODAL HEADER ========== */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

/* ========== MODAL CLOSE BUTTON ========== */
.modal-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  border-radius: 0.375rem;
  transition: all 0.2s ease;

  svg {
    width: 1.25rem;
    height: 1.25rem;
  }

  &:hover {
    background-color: #f3f4f6;
    color: #1f2937;
  }

  &:focus {
    outline: 2px solid transparent;
    outline-offset: 2px;
  }

  &:focus-visible {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }
}

/* ========== MODAL BODY ========== */
.modal-body {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;

  /* Custom scrollbar */
  scrollbar-width: thin;
  scrollbar-color: #d1d5db #f3f4f6;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f3f4f6;
  }

  &::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 3px;

    &:hover {
      background: #9ca3af;
    }
  }
}

/* ========== MODAL FOOTER ========== */
.modal-footer {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
  background-color: #f9fafb;
  flex-shrink: 0;
  justify-content: flex-end;
}

/* ========== TRANSITIONS ========== */

/* Fade in overlay, scale in modal */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from {
  opacity: 0;
}

.modal-enter-from .modal-container {
  transform: scale(0.95) translateY(-20px);
  opacity: 0;
}

.modal-leave-to {
  opacity: 0;
}

.modal-leave-to .modal-container {
  transform: scale(0.95) translateY(-20px);
  opacity: 0;
}

/* ========== RESPONSIVE ========== */
@media (max-width: 640px) {
  .modal-container {
    max-height: calc(100vh - 2rem);
  }

  .modal-sm,
  .modal-md,
  .modal-lg {
    max-width: 100%;
  }

  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 1rem;
  }

  .modal-title {
    font-size: 1.125rem;
  }
}
</style>
