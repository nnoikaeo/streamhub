<template>
  <div class="dashboard-card">
    <!-- Card Header with Icon -->
    <div class="card-header">
      <h3 class="card-title">{{ dashboard.name }}</h3>
      <div class="card-icon">
        <component :is="dashboardIcon" />
      </div>
    </div>

    <!-- Dashboard Type Badge -->
    <div class="dashboard-type">
      <component :is="dashboardTypeIcon" class="type-icon" />
      <span>{{ dashboardTypeLabel }}</span>
    </div>

    <!-- Permissions/Ownership Info -->
    <div class="dashboard-permissions">
      <div v-if="dashboard.owner === currentUserId" class="permission-item ownership">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        <span>Owned by you</span>
      </div>
      <div class="permission-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <span>You can: {{ permissionsText }}</span>
      </div>
    </div>

    <!-- Open Button - Using Primary Brand Color -->
    <button class="open-button" @click="$emit('view')">
      <span>Open</span>
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
  share: []
  menu: [event: MouseEvent]
}>()

// Mock current user ID (replace with actual auth)
const currentUserId = 'current-user-id'

// Dashboard type mapping
const dashboardTypeLabel = computed(() => {
  const typeMap: Record<string, string> = {
    performance: 'Performance Dashboard',
    geographic: 'Geographic Dashboard',
    forecast: 'Forecast Dashboard',
    analysis: 'Analysis Dashboard',
    looker: 'Looker Dashboard',
    custom: 'Custom Dashboard',
    external: 'External Dashboard',
  }
  return typeMap[props.dashboard.type] || 'Dashboard'
})

// Permissions text
const permissionsText = computed(() => {
  if (props.dashboard.owner === currentUserId) {
    return 'View, Edit'
  }
  return 'View'
})

// Dashboard type icon component
const dashboardTypeIcon = computed(() => {
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
      h('path', { d: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z' }),
      h('circle', { cx: '12', cy: '10', r: '3' })
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

// Large dashboard icon for top-right corner
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
   DASHBOARD CARD - Using StreamHub Theme Variables
   ============================================================================ */

.dashboard-card {
  display: flex;
  flex-direction: column;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
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
  margin-bottom: var(--spacing-md);
  gap: var(--spacing-md);
}

.card-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-primary);
  margin: 0;
  line-height: 1.4;
  flex: 1;
}

.card-icon {
  flex-shrink: 0;
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-neutral-400);
}

.card-icon svg {
  width: 2rem;
  height: 2rem;
}

/* ========== DASHBOARD TYPE ========== */
.dashboard-type {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
  padding: var(--spacing-sm) 0;
}

.type-icon {
  width: 1rem;
  height: 1rem;
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

.dashboard-type span {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  font-weight: 500;
}

/* ========== PERMISSIONS ========== */
.dashboard-permissions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
  flex: 1;
}

.permission-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.permission-item.ownership {
  color: var(--color-text-primary);
}

.permission-item svg {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

/* ========== OPEN BUTTON - Using Primary Brand Color ========== */
.open-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  width: 100%;
  padding: 0.875rem var(--spacing-lg);
  background: var(--color-primary);
  color: var(--color-text-inverse);
  border: none;
  border-radius: var(--radius-md);
  font-size: 0.9375rem;
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
  width: 1.125rem;
  height: 1.125rem;
  transition: transform var(--transition-fast);
}

.open-button:hover svg {
  transform: translateX(2px);
}

/* ========== RESPONSIVE ========== */
@media (max-width: 768px) {
  .dashboard-card {
    padding: var(--spacing-md);
  }
  
  .card-title {
    font-size: 1rem;
  }
  
  .card-icon {
    width: 2rem;
    height: 2rem;
  }
  
  .card-icon svg {
    width: 1.5rem;
    height: 1.5rem;
  }
}
</style>
