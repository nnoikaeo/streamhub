<script setup lang="ts">
/**
 * AppToast — Global toast notification renderer
 *
 * Place once in app.vue. Renders all toasts from the useToast() composable.
 * Supports stacking multiple toasts with smooth enter/leave transitions.
 */import { useAppToast } from '~/composables/useToast'
const { toasts, dismissToast } = useAppToast()
</script>

<template>
  <Teleport to="body">
    <TransitionGroup name="app-toast" tag="div" class="app-toast-container">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="app-toast"
        :class="`app-toast--${toast.type}`"
        @click="dismissToast(toast.id)"
      >
        <span class="app-toast__icon">{{ toast.type === 'success' ? '✅' : '❌' }}</span>
        <span class="app-toast__message">{{ toast.message }}</span>
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<style scoped>
.app-toast-container {
  position: fixed;
  top: 1.25rem;
  right: 1.25rem;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  pointer-events: none;
}

.app-toast {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-width: 24rem;
  cursor: pointer;
  user-select: none;
}

.app-toast--success {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.app-toast--error {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

/* Transition */
.app-toast-enter-active,
.app-toast-leave-active {
  transition: all 0.3s ease;
}

.app-toast-enter-from {
  opacity: 0;
  transform: translateX(1rem);
}

.app-toast-leave-to {
  opacity: 0;
  transform: translateX(1rem);
}

.app-toast-move {
  transition: transform 0.3s ease;
}
</style>
