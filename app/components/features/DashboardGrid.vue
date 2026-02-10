<template>
  <div class="dashboard-grid">
    <!-- Empty State -->
    <div v-if="dashboards.length === 0" class="grid-empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="9" y1="3" x2="9" y2="21" />
      </svg>
      <p>{{ emptyMessage }}</p>
    </div>

    <!-- Dashboard Cards Grid -->
    <div v-else class="cards-grid">
      <DashboardCard
        v-for="dashboard in dashboards"
        :key="dashboard.id"
        :dashboard="dashboard"
        @view="$emit('view-dashboard', dashboard)"
        @share="$emit('share-dashboard', dashboard)"
        @menu="$emit('menu-dashboard', dashboard, $event)"
      />
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="grid-loading">
      <div class="loading-spinner" />
      <p>Loading dashboards...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type Dashboard } from '../../types/dashboard'
import DashboardCard from './DashboardCard.vue'

/**
 * DashboardGrid - Responsive 2-column grid of dashboard cards
 *
 * Features:
 * - 2-column grid layout (1 column on mobile)
 * - Dashboard cards with hover effects
 * - Empty state handling
 * - Loading state with spinner
 * - Card click events propagation
 * - Mobile-friendly responsive design
 *
 * Events:
 * - view-dashboard: User clicked on dashboard card
 * - share-dashboard: User clicked share on card
 * - menu-dashboard: User clicked menu on card
 *
 * Usage:
 * <DashboardGrid
 *   :dashboards="visibleDashboards"
 *   :loading="isLoading"
 *   @view-dashboard="handleViewDashboard"
 *   @share-dashboard="handleShareDashboard"
 * />
 */

defineProps({
  /**
   * Array of dashboards to display
   */
  dashboards: {
    type: Array as () => Dashboard[],
    default: () => [],
  },

  /**
   * Loading state
   */
  loading: {
    type: Boolean,
    default: false,
  },

  /**
   * Message when no dashboards
   */
  emptyMessage: {
    type: String,
    default: 'No dashboards found in this folder',
  },
})

defineEmits<{
  'view-dashboard': [dashboard: Dashboard]
  'share-dashboard': [dashboard: Dashboard]
  'menu-dashboard': [dashboard: Dashboard, event: MouseEvent]
}>()
</script>

<style scoped>
.dashboard-grid {
  position: relative;
  width: 100%;
  height: 100%;
}

/* ========== CARDS GRID - 2 COLUMNS ========== */
.cards-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  width: 100%;
}

/* ========== EMPTY STATE ========== */
.grid-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #d1d5db;

  svg {
    width: 3rem;
    height: 3rem;
    margin-bottom: 1rem;
  }

  p {
    font-size: 1rem;
    color: #9ca3af;
  }
}

/* ========== LOADING STATE ========== */
.grid-loading {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(4px);
  gap: 1rem;
  z-index: 10;
}

.loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 2px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ========== RESPONSIVE ========== */

/* Tablet - Still 2 columns */
@media (max-width: 1024px) {
  .cards-grid {
    gap: 1.25rem;
  }
}

/* Mobile - 1 column */
@media (max-width: 768px) {
  .cards-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}
</style>