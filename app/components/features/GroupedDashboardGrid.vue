<template>
  <div class="grouped-dashboard-grid" :class="`grouped-dashboard-grid--${viewMode}`">
    <!-- Empty State -->
    <div v-if="!loading && groups.length === 0" class="grid-empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="9" y1="3" x2="9" y2="21" />
      </svg>
      <p>{{ emptyMessage }}</p>
    </div>

    <!-- Groups (generic DisplayGroup) -->
    <section
      v-for="group in groups"
      :key="group.id"
      class="folder-group"
    >
      <GroupDivider
        :group="group"
        :collapsed="collapsedGroups.has(group.id)"
        :size="viewMode === 'compact' ? 'compact' : 'default'"
        :title="group.subtitle || ''"
        @toggle="$emit('toggle-group', group.id)"
      />
      <Transition name="folder-collapse">
        <div v-if="!collapsedGroups.has(group.id)" class="folder-group__content">
          <DashboardGrid
            :dashboards="maxPerGroup ? group.dashboards.slice(0, maxPerGroup) : group.dashboards"
            :loading="false"
            :view-mode="viewMode"
            @view-dashboard="(d) => $emit('view-dashboard', d)"
            @share-dashboard="(d) => $emit('share-dashboard', d)"
            @menu-dashboard="(d, e) => $emit('menu-dashboard', d, e)"
          />
          <button
            v-if="maxPerGroup && group.dashboards.length > maxPerGroup"
            type="button"
            class="view-all-link"
            @click="$emit('view-group', group.id)"
          >
            ดูทั้งหมด {{ group.dashboards.length }} แดชบอร์ด →
          </button>
        </div>
      </Transition>
    </section>

    <!-- Loading State -->
    <div v-if="loading" class="grid-loading">
      <div class="loading-spinner" />
      <p>Loading dashboards...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Dashboard, User, DisplayGroup } from '~/types/dashboard'
import type { ViewMode } from '~/types/dashboard'
import DashboardGrid from './DashboardGrid.vue'
import GroupDivider from './GroupDivider.vue'

/** @deprecated Use DisplayGroup instead — kept for backward compatibility */
export interface DashboardGroup {
  folder: { id: string; name: string; assignedModerators?: string[] }
  dashboards: Dashboard[]
}

withDefaults(defineProps<{
  groups: DisplayGroup[]
  loading?: boolean
  emptyMessage?: string
  userMap?: Record<string, User>
  viewMode?: ViewMode
  collapsedGroups?: Set<string>
  maxPerGroup?: number
}>(), {
  loading: false,
  emptyMessage: 'ไม่พบแดชบอร์ด',
  userMap: () => ({}),
  viewMode: 'grid',
  collapsedGroups: () => new Set<string>(),
})

defineEmits<{
  'view-dashboard': [dashboard: Dashboard]
  'share-dashboard': [dashboard: Dashboard]
  'menu-dashboard': [dashboard: Dashboard, event: MouseEvent]
  'toggle-group': [groupId: string]
  'view-group': [groupId: string]
}>()
</script>

<style scoped>
.grouped-dashboard-grid {
  display: flex;
  flex-direction: column;
}

/* Gap varies by view mode */
.grouped-dashboard-grid--grid {
  gap: 12px;
}

.grouped-dashboard-grid--compact {
  gap: 8px;
}

.grouped-dashboard-grid--list {
  gap: 12px;
}

/* ========== FOLDER GROUP ========== */
.folder-group {
  display: flex;
  flex-direction: column;
}

.folder-group__content {
  overflow: hidden;
}

/* ========== COLLAPSE TRANSITION ========== */
.folder-collapse-enter-active,
.folder-collapse-leave-active {
  transition: opacity 200ms ease, max-height 200ms ease;
  max-height: 2000px;
  opacity: 1;
}

.folder-collapse-enter-from,
.folder-collapse-leave-to {
  max-height: 0;
  opacity: 0;
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

/* ========== VIEW ALL LINK ========== */
.view-all-link {
  display: block;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-primary);
  font-size: 0.85rem;
  padding-top: var(--spacing-sm);
  text-align: right;
  width: 100%;

  &:hover {
    text-decoration: underline;
  }
}
</style>
