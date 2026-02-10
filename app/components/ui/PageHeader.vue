<template>
  <div :class="['page-header', { 'page-header--centered': align === 'center' }]">
    <div class="page-header__content">
      <!-- Icon + Title + Subtitle -->
      <div class="page-header__info">
        <div v-if="icon" class="page-header__icon">{{ icon }}</div>
        <div>
          <h1 class="page-header__title">{{ title }}</h1>
          <p v-if="subtitle" class="page-header__subtitle">
            <span v-if="subtitleIcon" class="subtitle-icon">{{ subtitleIcon }}</span>
            {{ subtitle }}
          </p>
        </div>
      </div>

      <!-- Action Button -->
      <div v-if="actionLabel" class="page-header__actions">
        <button
          class="page-header__button"
          :disabled="actionDisabled || actionLoading"
          @click="$emit('action-click')"
        >
          <span v-if="actionIcon" class="action-icon">{{ actionIcon }}</span>
          {{ actionLoading ? 'Loading...' : actionLabel }}
        </button>
      </div>
    </div>

    <div v-if="divider" class="page-header__divider"></div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  // Core
  icon?: string
  title: string
  subtitle?: string
  subtitleIcon?: string

  // Action button
  actionLabel?: string
  actionIcon?: string
  actionLoading?: boolean
  actionDisabled?: boolean

  // Layout
  align?: 'left' | 'center'
  divider?: boolean
}

withDefaults(defineProps<Props>(), {
  align: 'left',
  divider: true,
  actionLoading: false,
  actionDisabled: false
})

defineEmits<{
  'action-click': []
}>()
</script>

<style scoped>
.page-header {
  background-color: var(--color-bg-primary);
  padding: var(--spacing-lg) var(--spacing-xl);
}

.page-header__content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-lg);
}

.page-header__info {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.page-header__icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.page-header__title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-primary);
  margin: 0 0 var(--spacing-xs) 0;
  line-height: 1.2;
}

.page-header__subtitle {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.subtitle-icon {
  display: inline-flex;
}

.page-header__actions {
  flex-shrink: 0;
}

.page-header__button {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 0.75rem 1.5rem;
  background-color: var(--color-primary);
  color: var(--color-text-inverse);
  border: none;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.page-header__button:hover:not(:disabled) {
  background-color: var(--color-primary-dark);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.page-header__button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.page-header__divider {
  margin-top: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border-light);
}

.page-header--centered .page-header__content {
  flex-direction: column;
  text-align: center;
}

.page-header--centered .page-header__info {
  flex-direction: column;
  justify-content: center;
}

/* Responsive */
@media (max-width: 768px) {
  .page-header {
    padding: var(--spacing-md) var(--spacing-lg);
  }

  .page-header__content {
    flex-direction: column;
    align-items: flex-start;
  }

  .page-header__title {
    font-size: 1.25rem;
  }

  .page-header__button {
    width: 100%;
    justify-content: center;
  }
}
</style>
