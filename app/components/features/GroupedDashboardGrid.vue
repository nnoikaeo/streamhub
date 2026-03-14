<template>
  <div class="grouped-dashboard-grid">
    <!-- Empty State -->
    <div v-if="!loading && groups.length === 0" class="grid-empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="9" y1="3" x2="9" y2="21" />
      </svg>
      <p>{{ emptyMessage }}</p>
    </div>

    <!-- Folder Groups -->
    <section
      v-for="group in groups"
      :key="group.folder.id"
      class="folder-group"
    >
      <div class="folder-group__header">
        <svg class="folder-group__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
        <h3 class="folder-group__name">{{ group.folder.name }}</h3>
        <span class="folder-group__count">{{ group.dashboards.length }}</span>
      </div>
      <DashboardGrid
        :dashboards="group.dashboards"
        :loading="false"
        @view-dashboard="(d) => $emit('view-dashboard', d)"
        @share-dashboard="(d) => $emit('share-dashboard', d)"
        @menu-dashboard="(d, e) => $emit('menu-dashboard', d, e)"
      />
    </section>

    <!-- Loading State -->
    <div v-if="loading" class="grid-loading">
      <div class="loading-spinner" />
      <p>Loading dashboards...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Dashboard, Folder } from '~/types/dashboard'
import DashboardGrid from './DashboardGrid.vue'

export interface DashboardGroup {
  folder: Folder
  dashboards: Dashboard[]
}

withDefaults(defineProps<{
  groups: DashboardGroup[]
  loading?: boolean
  emptyMessage?: string
}>(), {
  loading: false,
  emptyMessage: 'ไม่พบแดชบอร์ด',
})

defineEmits<{
  'view-dashboard': [dashboard: Dashboard]
  'share-dashboard': [dashboard: Dashboard]
  'menu-dashboard': [dashboard: Dashboard, event: MouseEvent]
}>()
</script>

<style scoped>
.grouped-dashboard-grid {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

/* ========== FOLDER GROUP ========== */
.folder-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.folder-group__header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--color-border-light);
}

.folder-group__icon {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--color-primary);
  flex-shrink: 0;
}

.folder-group__name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.folder-group__count {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  background-color: var(--color-bg-secondary, #f3f4f6);
  padding: 2px 8px;
  border-radius: 9999px;
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
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl) 0;
  gap: 1rem;
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
</style>
