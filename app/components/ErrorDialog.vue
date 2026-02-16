<script setup lang="ts">
interface Props {
  isOpen: boolean
  title?: string
  message: string
  showRequestAccess?: boolean
  onClose: () => void
  onRequestAccess?: () => void
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Access Denied',
  showRequestAccess: false
})

const handleRequestAccess = () => {
  if (props.onRequestAccess) {
    props.onRequestAccess()
  }
}
</script>

<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="fade">
      <div
        v-if="isOpen"
        class="error-backdrop"
        @click="onClose"
      />
    </Transition>

    <!-- Modal -->
    <Transition name="slide-up">
      <div v-if="isOpen" class="error-dialog">
        <!-- Icon -->
        <div class="error-icon-wrapper">
          <svg class="error-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="11" stroke="currentColor" stroke-width="2" />
            <path d="M12 7V12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            <circle cx="12" cy="16" r="1" fill="currentColor" />
          </svg>
        </div>

        <!-- Title -->
        <h3 class="error-title">{{ title }}</h3>

        <!-- Message -->
        <p class="error-message">{{ message }}</p>

        <!-- Actions -->
        <div class="error-actions">
          <button
            @click="onClose"
            class="error-button error-button--primary"
          >
            กลับไปยังหน้าลงชื่อเข้า
          </button>
          <button
            v-if="showRequestAccess"
            @click="handleRequestAccess"
            class="error-button error-button--secondary"
          >
            ขอสิทธิ์การเข้าถึง
          </button>
        </div>

        <!-- Support Info -->
        <div class="error-support">
          <p class="error-support-text">
            ต้องการความช่วยเหลือ? ติดต่อ <a href="mailto:support@streamhub.com" class="error-support-link">support@streamhub.com</a>
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Backdrop */
.error-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 40;
}

/* Dialog Container */
.error-dialog {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 400px;
  background-color: var(--color-bg-primary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-2xl);
  box-shadow: var(--shadow-2xl);
  z-index: 50;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
}

/* Icon Wrapper */
.error-icon-wrapper {
  width: 64px;
  height: 64px;
  background-color: rgba(239, 68, 68, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--spacing-md);
}

.error-icon {
  width: 36px;
  height: 36px;
  color: var(--color-error);
}

/* Title */
.error-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text-primary);
  text-align: center;
  margin: 0;
}

/* Message */
.error-message {
  font-size: 0.95rem;
  color: var(--color-text-secondary);
  text-align: center;
  margin: 0;
  line-height: 1.6;
}

/* Actions */
.error-actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  width: 100%;
  margin-top: var(--spacing-md);
}

/* Button Styles */
.error-button {
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--radius-md);
  font-size: 0.95rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all var(--transition-base);
  width: 100%;
}

.error-button--primary {
  background-color: var(--color-info);
  color: white;
}

.error-button--primary:hover {
  background-color: #1d4ed8;
  box-shadow: var(--shadow-md);
}

.error-button--secondary {
  background-color: transparent;
  color: var(--color-info);
  border: 1px solid var(--color-info);
}

.error-button--secondary:hover {
  background-color: rgba(59, 130, 246, 0.1);
}

/* Support Info */
.error-support {
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--color-border-light);
  width: 100%;
}

.error-support-text {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  text-align: center;
  margin: 0;
}

.error-support-link {
  color: var(--color-info);
  text-decoration: none;
  font-weight: 600;
}

.error-support-link:hover {
  text-decoration: underline;
}

/* Animations */
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-base);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all var(--transition-base);
}

.slide-up-enter-from {
  opacity: 0;
  transform: translate(-50%, -40%);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translate(-50%, -40%);
}

/* Mobile Responsive */
@media (max-width: 640px) {
  .error-dialog {
    width: 95%;
    max-width: 90vw;
  }

  .error-actions {
    flex-direction: column;
  }
}
</style>
