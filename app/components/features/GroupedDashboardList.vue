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
      <button
        type="button"
        class="folder-group__header"
        :aria-expanded="!collapsedFolders.has(group.folder.id)"
        @click="$emit('toggle-folder', group.folder.id)"
      >
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
        <svg
          class="folder-group__chevron"
          :class="{ 'is-collapsed': collapsedFolders.has(group.folder.id) }"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <!-- Collapsible content -->
      <Transition name="folder-collapse">
        <div v-if="!collapsedFolders.has(group.folder.id)" class="folder-group__content">
          <DashboardList
            :dashboards="maxPerFolder ? group.dashboards.slice(0, maxPerFolder) : group.dashboards"
            :tags="tags"
            :loading="false"
            :visible-columns="visibleColumns"
            :folder-map="folderMap"
            empty-message="ไม่พบแดชบอร์ดในโฟลเดอร์นี้"
            @view-dashboard="(d) => $emit('view-dashboard', d)"
            @share-dashboard="(d) => $emit('share-dashboard', d)"
            @menu-dashboard="(d, e) => $emit('menu-dashboard', d, e)"
          />
          <button
            v-if="maxPerFolder && group.dashboards.length > maxPerFolder"
            type="button"
            class="view-all-link"
            @click="$emit('view-folder', group.folder.id)"
          >
            ดูทั้งหมด {{ group.dashboards.length }} แดชบอร์ด →
          </button>
        </div>
      </Transition>
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
import DashboardList, { type ListColumn } from './DashboardList.vue'

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
  collapsedFolders?: Set<string>
  maxPerFolder?: number
  visibleColumns?: ListColumn[]
  folderMap?: Record<string, string>
}>(), {
  loading: false,
  emptyMessage: 'ไม่พบแดชบอร์ด',
  userMap: () => ({}),
  collapsedFolders: () => new Set<string>(),
  visibleColumns: () => ['tags', 'company'],
  folderMap: () => ({}),
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
  'toggle-folder': [folderId: string]
  'view-folder': [folderId: string]
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
}

/* ========== FOLDER GROUP HEADER (clickable) ========== */
.folder-group__header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--color-border-light);
  background: none;
  border-top: none;
  border-left: none;
  border-right: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  color: inherit;
  padding-top: 0;
  padding-left: 0;
  padding-right: 0;
  border-radius: 0;

  &:hover .folder-group__name {
    color: var(--color-primary);
  }
}

.folder-group__chevron {
  width: 1rem;
  height: 1rem;
  color: var(--color-text-secondary);
  flex-shrink: 0;
  margin-left: auto;
  transition: transform 200ms ease;

  &.is-collapsed {
    transform: rotate(-90deg);
  }
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

/* ========== RESPONSIVE ========== */
@media (max-width: 768px) {
  .folder-group__moderator {
    display: none;
  }

  .folder-group__header {
    gap: var(--spacing-xs, 0.25rem);
  }
}
</style>
