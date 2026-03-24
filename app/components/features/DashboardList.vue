<template>
  <div class="dashboard-list">
    <!-- Empty State -->
    <div v-if="!loading && dashboards.length === 0" class="list-empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
      <p>{{ emptyMessage }}</p>
    </div>

    <template v-else-if="dashboards.length > 0">
      <!-- Header Row -->
      <div class="list-header">
        <div class="list-header__swatch" />
        <span class="list-header__col list-header__name">ชื่อ</span>
        <span v-if="showFolder" class="list-header__col list-header__folder">โฟลเดอร์</span>
        <span v-if="showTags" class="list-header__col list-header__tags">แท็ก</span>
        <span v-if="showCompany" class="list-header__col list-header__company">บริษัท</span>
        <div class="list-header__arrow" />
      </div>

      <!-- List Items -->
      <DashboardListItem
        v-for="dashboard in dashboards"
        :key="dashboard.id"
        :dashboard="dashboard"
        :tags="tags"
        :visible-columns="visibleColumns"
        :folder-map="folderMap"
        @view="$emit('view-dashboard', dashboard)"
      />
    </template>

    <!-- Loading Overlay -->
    <div v-if="loading" class="list-loading">
      <div class="loading-spinner" />
      <p>กำลังโหลด...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Dashboard } from '~/types/dashboard'
import type { Tag } from '~/types/tag'
import DashboardListItem from './DashboardListItem.vue'

export type ListColumn = 'tags' | 'company' | 'folder'

const props = withDefaults(defineProps<{
  dashboards?: Dashboard[]
  tags?: Tag[]
  loading?: boolean
  emptyMessage?: string
  visibleColumns?: ListColumn[]
  folderMap?: Record<string, string>
}>(), {
  dashboards: () => [],
  loading: false,
  emptyMessage: 'ไม่พบแดชบอร์ด',
  visibleColumns: () => ['tags', 'company'],
  folderMap: () => ({}),
})

const showFolder = computed(() => props.visibleColumns.includes('folder'))
const showTags = computed(() => props.visibleColumns.includes('tags'))
const showCompany = computed(() => props.visibleColumns.includes('company'))

defineEmits<{
  'view-dashboard': [dashboard: Dashboard]
  'share-dashboard': [dashboard: Dashboard]
  'menu-dashboard': [dashboard: Dashboard, event: MouseEvent]
}>()
</script>

<style scoped>
.dashboard-list {
  position: relative;
  width: 100%;
  background: var(--color-bg-primary, #ffffff);
  border: 1px solid var(--color-border-light, #e5e7eb);
  border-radius: var(--radius-lg, 12px);
  overflow: hidden;
}

/* ---- Header Row ---- */
.list-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm, 0.5rem);
  padding: var(--spacing-xs, 0.25rem) var(--spacing-sm, 0.5rem);
  background: var(--color-bg-secondary, #f9fafb);
  border-bottom: 1px solid var(--color-border-light, #e5e7eb);
}

.list-header__swatch {
  flex-shrink: 0;
  width: 32px;
}

.list-header__col {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-secondary, #6b7280);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.list-header__name {
  flex: 1;
  min-width: 0;
}

.list-header__folder {
  flex-shrink: 0;
  min-width: 100px;
}

.list-header__tags {
  flex-shrink: 0;
  min-width: 120px;
}

.list-header__company {
  flex-shrink: 0;
  min-width: 80px;
}

.list-header__arrow {
  flex-shrink: 0;
  width: 1rem;
}

/* ---- Empty State ---- */
.list-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: var(--color-text-secondary, #9ca3af);
  gap: 0.75rem;
}

.list-empty svg {
  width: 2.5rem;
  height: 2.5rem;
}

.list-empty p {
  font-size: 0.875rem;
  margin: 0;
}

/* ---- Loading Overlay ---- */
.list-loading {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.75);
  gap: 0.75rem;
  font-size: 0.875rem;
  color: var(--color-text-secondary, #6b7280);
}

.loading-spinner {
  width: 1.5rem;
  height: 1.5rem;
  border: 2px solid var(--color-border-light, #e5e7eb);
  border-top-color: var(--color-primary, #3b82f6);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ---- Responsive ---- */
@media (max-width: 768px) {
  .list-header__folder {
    display: none;
  }

  .list-header__tags {
    display: none;
  }

  .list-header__company {
    min-width: 60px;
  }
}
</style>
