<template>
  <div class="dashboard-card">
    <!-- Card Header with Icon -->
    <div class="card-header">
      <h3 class="card-title">{{ dashboard.name }}</h3>
      <div class="card-icon">
        <component :is="dashboardIcon" />
      </div>
    </div>

    <!-- Open Button - Using Primary Brand Color -->
    <button class="open-button" @click="$emit('view')">
      <span>เปิด</span>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, h } from 'vue'
import type { Dashboard } from '../../types/dashboard'

/**
 * DashboardCard - Individual dashboard card component
 * Uses StreamHub theme CSS variables for consistent styling
 */

interface Props {
  dashboard: Dashboard
}

const props = defineProps<Props>()

defineEmits<{
  view: []
}>()

// Dashboard icon for card header
const dashboardIcon = computed(() => {
  const iconMap: Record<string, any> = {
    performance: () => h('svg', {
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: '2',
    }, [
      h('polyline', { points: '22 12 18 12 15 21 9 3 6 12 2 12' })
    ]),
    geographic: () => h('svg', {
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: '2',
    }, [
      h('rect', { x: '3', y: '3', width: '7', height: '9' }),
      h('rect', { x: '14', y: '3', width: '7', height: '5' }),
      h('rect', { x: '14', y: '12', width: '7', height: '9' }),
      h('rect', { x: '3', y: '16', width: '7', height: '5' })
    ]),
    forecast: () => h('svg', {
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: '2',
    }, [
      h('polyline', { points: '23 6 13.5 15.5 8.5 10.5 1 18' }),
      h('polyline', { points: '17 6 23 6 23 12' })
    ]),
    analysis: () => h('svg', {
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: '2',
    }, [
      h('rect', { x: '3', y: '3', width: '7', height: '7' }),
      h('rect', { x: '14', y: '3', width: '7', height: '7' }),
      h('rect', { x: '14', y: '14', width: '7', height: '7' }),
      h('rect', { x: '3', y: '14', width: '7', height: '7' })
    ]),
  }
  
  return iconMap[props.dashboard.type] || iconMap.analysis
})
</script>

<style scoped>
/* ============================================================================
   DASHBOARD CARD - Compact Design
   ============================================================================ */

.dashboard-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
  transition: all var(--transition-base);
  box-shadow: var(--shadow-sm);
}

.dashboard-card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--color-border-default);
}

/* ========== CARD HEADER ========== */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--spacing-sm);
}

.card-title {
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--color-primary);
  margin: 0;
  line-height: 1.3;
  flex: 1;
  word-break: break-word;
}

.card-icon {
  flex-shrink: 0;
  width: 1.75rem;
  height: 1.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-neutral-400);
}

.card-icon svg {
  width: 1.5rem;
  height: 1.5rem;
}

/* ========== OPEN BUTTON ========== */
.open-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  width: 100%;
  padding: 0.65rem var(--spacing-md);
  background: var(--color-primary);
  color: var(--color-text-inverse);
  border: none;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  margin-top: auto;
}

.open-button:hover {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.open-button:active {
  transform: translateY(0);
}

.open-button svg {
  width: 1rem;
  height: 1rem;
  transition: transform var(--transition-fast);
}

.open-button:hover svg {
  transform: translateX(2px);
}

/* ========== RESPONSIVE ========== */
@media (max-width: 768px) {
  .dashboard-card {
    padding: var(--spacing-sm);
  }

  .card-title {
    font-size: 0.875rem;
  }

  .card-icon {
    width: 1.5rem;
    height: 1.5rem;
  }

  .card-icon svg {
    width: 1.25rem;
    height: 1.25rem;
  }
}
</style>
