<template>
  <div
    :class="['stats-card', `stats-card--${variant}`, { 'stats-card--clickable': clickable }]"
    @click="clickable && $emit('click')"
  >
    <!-- Loading State -->
    <div v-if="loading" class="stats-card__loading">
      <div class="skeleton skeleton--icon"></div>
      <div class="skeleton skeleton--text"></div>
      <div class="skeleton skeleton--text" style="width: 70%"></div>
    </div>

    <!-- Content -->
    <div v-else class="stats-card__content">
      <!-- Icon -->
      <div v-if="icon" :class="['stats-card__icon', iconColor, iconBackground]">
        {{ icon }}
      </div>

      <!-- Info -->
      <div class="stats-card__info">
        <p class="stats-card__title">{{ title }}</p>
        <p class="stats-card__value">
          {{ formattedValue }}
          <span v-if="unit" class="stats-card__unit">{{ unit }}</span>
        </p>
        <p v-if="subtitle" class="stats-card__subtitle">{{ subtitle }}</p>
      </div>

      <!-- Trend -->
      <div v-if="trend" :class="['stats-card__trend', `stats-card__trend--${trend}`]">
        <span v-if="trendValue" class="trend-value">{{ trendValue }}</span>
        <span v-if="trendLabel" class="trend-label">{{ trendLabel }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  title: string
  value: string | number
  subtitle?: string
  icon?: string
  iconColor?: string
  iconBackground?: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string | number
  trendLabel?: string
  unit?: string
  format?: 'number' | 'currency' | 'percent'
  variant?: 'default' | 'compact' | 'detailed'
  clickable?: boolean
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  clickable: false,
  loading: false,
  format: 'number'
})

defineEmits<{
  click: []
}>()

const formattedValue = computed(() => {
  const val = props.value

  if (props.format === 'currency') {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0
    }).format(Number(val))
  }

  if (props.format === 'percent') {
    return `${val}%`
  }

  // Number format
  return new Intl.NumberFormat('th-TH').format(Number(val))
})
</script>

<style scoped>
.stats-card {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  transition: all var(--transition-base);
  min-height: 120px;
}

.stats-card--clickable {
  cursor: pointer;
}

.stats-card--clickable:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--color-border-default);
  transform: translateY(-2px);
}

.stats-card__content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  height: 100%;
}

.stats-card__icon {
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  font-size: 1.5rem;
  flex-shrink: 0;
}

.stats-card__info {
  flex: 1;
}

.stats-card__title {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin: 0 0 var(--spacing-xs) 0;
  font-weight: 500;
}

.stats-card__value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
  line-height: 1.2;
}

.stats-card__unit {
  font-size: 0.875rem;
  font-weight: 400;
  color: var(--color-text-secondary);
  margin-left: var(--spacing-xs);
}

.stats-card__subtitle {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  margin: var(--spacing-xs) 0 0 0;
}

.stats-card__trend {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: 0.875rem;
  font-weight: 600;
}

.stats-card__trend--up {
  color: var(--color-success);
}

.stats-card__trend--down {
  color: var(--color-error);
}

.stats-card__trend--neutral {
  color: var(--color-text-secondary);
}

.trend-value {
  display: inline;
}

.trend-label {
  font-size: 0.75rem;
  font-weight: 400;
  color: inherit;
}

/* Skeleton loading */
.stats-card__loading {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  height: 100%;
}

.skeleton {
  background: var(--color-neutral-200);
  border-radius: var(--radius-sm);
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.skeleton--icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: var(--radius-md);
}

.skeleton--text {
  height: 1rem;
  width: 100%;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Variants */
.stats-card--compact {
  padding: var(--spacing-md);
  min-height: auto;
}

.stats-card--compact .stats-card__value {
  font-size: 1.25rem;
}

.stats-card--detailed {
  padding: var(--spacing-xl);
}

.stats-card--detailed .stats-card__title {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Responsive */
@media (max-width: 768px) {
  .stats-card {
    padding: var(--spacing-md);
    min-height: auto;
  }

  .stats-card__value {
    font-size: 1.25rem;
  }

  .stats-card__icon {
    width: 2rem;
    height: 2rem;
    font-size: 1.25rem;
  }
}
</style>
