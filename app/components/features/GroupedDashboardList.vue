<template>
  <div class="grouped-dashboard-list">
    <!-- Empty State -->
    <div v-if="!loading && groups.length === 0" class="list-empty">
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

    <!-- Folder Groups -->
    <section
      v-for="group in groups"
      :key="group.folder.id"
      class="folder-group"
    >
      <!-- Folder Header -->
      <div class="folder-group__header">
        <svg class="folder-group__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
        <h3 class="folder-group__name">{{ group.folder.name }}</h3>
        <span class="folder-group__count">{{ group.dashboards.length }}</span>
        <span
          v-if="getModeratorLabel(group.folder)"
          class="folder-group__moderator"
        >
          ผู้ดูแล: {{ getModeratorLabel(group.folder) }}
        </span>
      </div>

      <!-- List for this group -->
      <DashboardList
        :dashboards="group.dashboards"
        :tags="tags"
        :loading="false"
        empty-message="ไม่พบแดชบอร์ดในโฟลเดอร์นี้"
        @view-dashboard="(d) => $emit('view-dashboard', d)"
        @share-dashboard="(d) => $emit('share-dashboard', d)"
        @menu-dashboard="(d, e) => $emit('menu-dashboard', d, e)"
      />
    </section>

    <!-- Loading State -->
    <div v-if="loading" class="list-loading">
      <div class="loading-spinner" />
      <p>กำลังโหลด...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Dashboard, Folder, User } from '~/types/dashboard'
import type { Tag } from '~/types/tag'
import DashboardList from './DashboardList.vue'

export interface DashboardGroup {
  folder: Folder
  dashboards: Dashboard[]
}

const props = withDefaults(defineProps<{
  groups: DashboardGroup[]
  tags?: Tag[]
  loading?: boolean
  emptyMessage?: string
  userMap?: Record<string, User>
}>(), {
  loading: false,
  emptyMessage: 'ไม่พบแดชบอร์ด',
  userMap: () => ({}),
})

const getModeratorLabel = (folder: Folder): string => {
  const mods = folder.assignedModerators
  if (!mods || mods.length === 0) return ''
  return mods
    .map(uid => {
      const user = props.userMap[uid]
      if (!user) return uid
      return `${user.name} (${user.company})`
    })
    .join(', ')
}

defineEmits<{
  'view-dashboard': [dashboard: Dashboard]
  'share-dashboard': [dashboard: Dashboard]
  'menu-dashboard': [dashboard: Dashboard, event: MouseEvent]
}>()
</script>

<style scoped>
.grouped-dashboard-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

/* ========== FOLDER GROUP ========== */
.folder-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
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

.folder-group__moderator {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  margin-left: auto;
}

/* ========== EMPTY STATE ========== */
.list-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #d1d5db;
}

.list-empty svg {
  width: 3rem;
  height: 3rem;
  margin-bottom: 1rem;
}

.list-empty p {
  font-size: 1rem;
  color: #9ca3af;
}

/* ========== LOADING STATE ========== */
.list-loading {
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
  to { transform: rotate(360deg); }
}
</style>
