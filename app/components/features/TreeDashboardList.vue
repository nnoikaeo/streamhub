<template>
  <div class="tree-dashboard-list">
    <!-- Empty State -->
    <div v-if="!loading && groups.length === 0" class="tree-empty">
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

    <template v-else-if="groups.length > 0">
      <!-- Sticky Header Row -->
      <div class="tree-header">
        <div class="tree-header__toggle" />
        <div class="tree-header__swatch" />
        <span class="tree-header__col tree-header__name">ชื่อ</span>
        <span v-if="showFolder" class="tree-header__col tree-header__folder">โฟลเดอร์</span>
        <span v-if="showTags" class="tree-header__col tree-header__tags">แท็ก</span>
        <span v-if="showCompany" class="tree-header__col tree-header__company">บริษัท</span>
        <div class="tree-header__arrow" />
      </div>

      <!-- Groups -->
      <div
        v-for="(group, groupIndex) in groups"
        :key="group.id"
        class="tree-group"
        :class="{ 'tree-group--separator': groupIndex > 0 }"
      >
        <!-- Group Row -->
        <button
          type="button"
          class="tree-group-row"
          :aria-expanded="!collapsedGroups.has(group.id)"
          :aria-label="`กลุ่ม ${group.name} (${group.dashboards.length} แดชบอร์ด)`"
          :title="`${group.name} — ${group.dashboards.length} แดชบอร์ด`"
          @click="$emit('toggle-group', group.id)"
        >
          <!-- Chevron -->
          <svg
            class="tree-group-row__chevron"
            :class="{ 'is-collapsed': collapsedGroups.has(group.id) }"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>

          <!-- Group Icon -->
          <span v-if="group.icon === 'folder'" class="tree-group-row__icon tree-group-row__icon--folder">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </span>
          <span
            v-else-if="group.icon === 'tag'"
            class="tree-group-row__icon tree-group-row__icon--tag"
          >
            <span class="tag-dot" :style="{ background: group.color || 'var(--color-text-secondary)' }" />
          </span>
          <span v-else-if="group.icon === 'company'" class="tree-group-row__icon tree-group-row__icon--company">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="4" y="2" width="16" height="20" rx="2" />
              <line x1="9" y1="6" x2="9" y2="6.01" />
              <line x1="15" y1="6" x2="15" y2="6.01" />
              <line x1="9" y1="10" x2="9" y2="10.01" />
              <line x1="15" y1="10" x2="15" y2="10.01" />
              <line x1="9" y1="14" x2="9" y2="14.01" />
              <line x1="15" y1="14" x2="15" y2="14.01" />
              <path d="M9 18h6v4H9z" />
            </svg>
          </span>

          <!-- Group Name -->
          <span class="tree-group-row__name">{{ group.name }}</span>

          <!-- Count Badge -->
          <span class="tree-group-row__count">{{ displayCount(group) }}</span>

          <!-- Subtitle (moderator / extra info) -->
          <span v-if="getGroupSubtitle(group)" class="tree-group-row__subtitle">
            {{ getGroupSubtitle(group) }}
          </span>
        </button>

        <!-- Collapsible Dashboard Rows -->
        <Transition name="tree-collapse">
          <div v-if="!collapsedGroups.has(group.id)" class="tree-group-items">
            <DashboardListItem
              v-for="dashboard in limitedDashboards(group)"
              :key="dashboard.id"
              :dashboard="dashboard"
              :tags="tags"
              :visible-columns="visibleColumns"
              :folder-map="folderMap"
              class="tree-item"
              @view="$emit('view-dashboard', dashboard)"
            />
            <button
              v-if="maxPerGroup && group.dashboards.length > maxPerGroup"
              type="button"
              class="tree-view-all"
              @click="$emit('view-group', group.id)"
            >
              ดูทั้งหมด {{ group.dashboards.length }} แดชบอร์ด →
            </button>
          </div>
        </Transition>
      </div>
    </template>

    <!-- Loading State -->
    <div v-if="loading" class="tree-loading">
      <div class="loading-spinner" />
      <p>กำลังโหลด...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Dashboard, DisplayGroup } from '~/types/dashboard'
import type { Tag } from '~/types/tag'
import type { ListColumn } from './DashboardList.vue'
import DashboardListItem from './DashboardListItem.vue'

const props = withDefaults(defineProps<{
  groups: DisplayGroup[]
  tags?: Tag[]
  loading?: boolean
  emptyMessage?: string
  userMap?: Record<string, any>
  collapsedGroups?: Set<string>
  maxPerGroup?: number
  visibleColumns?: ListColumn[]
  folderMap?: Record<string, string>
}>(), {
  loading: false,
  emptyMessage: 'ไม่พบแดชบอร์ด',
  userMap: () => ({}),
  collapsedGroups: () => new Set<string>(),
  visibleColumns: () => ['tags', 'company'],
  folderMap: () => ({}),
})

defineEmits<{
  'view-dashboard': [dashboard: Dashboard]
  'toggle-group': [groupId: string]
  'view-group': [groupId: string]
}>()

const showFolder = computed(() => props.visibleColumns.includes('folder'))
const showTags = computed(() => props.visibleColumns.includes('tags'))
const showCompany = computed(() => props.visibleColumns.includes('company'))

const limitedDashboards = (group: DisplayGroup) => {
  if (props.maxPerGroup) return group.dashboards.slice(0, props.maxPerGroup)
  return group.dashboards
}

const displayCount = (group: DisplayGroup): string => {
  return `${group.dashboards.length}`
}

const getGroupSubtitle = (group: DisplayGroup): string => {
  if (group.subtitle) return group.subtitle
  // For folder groups, show moderator from userMap
  if (group.icon === 'folder' && props.userMap) {
    // Moderator info would be in subtitle if set during grouping
    return ''
  }
  return ''
}
</script>

<style scoped>
.tree-dashboard-list {
  width: 100%;
  background: var(--color-bg-primary, #ffffff);
  border: 1px solid var(--color-border-light, #e5e7eb);
  border-radius: var(--radius-lg, 12px);
  overflow: hidden;
}

/* ========== STICKY HEADER ========== */
.tree-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm, 0.5rem);
  padding: var(--spacing-xs, 0.25rem) var(--spacing-sm, 0.5rem);
  height: 36px;
  background: var(--color-bg-secondary, #f9fafb);
  border-bottom: 1px solid var(--color-border-light, #e5e7eb);
  position: sticky;
  top: 0;
  z-index: 2;
}

.tree-header__toggle {
  flex-shrink: 0;
  width: 20px;
}

.tree-header__swatch {
  flex-shrink: 0;
  width: 32px;
}

.tree-header__col {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-secondary, #6b7280);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.tree-header__name {
  flex: 1;
  min-width: 0;
}

.tree-header__folder {
  flex-shrink: 0;
  min-width: 100px;
}

.tree-header__tags {
  flex-shrink: 0;
  min-width: 120px;
}

.tree-header__company {
  flex-shrink: 0;
  min-width: 80px;
}

.tree-header__arrow {
  flex-shrink: 0;
  width: 1rem;
}

/* ========== GROUP ========== */
.tree-group--separator {
  border-top: 1px solid var(--color-border-light, #e5e7eb);
}

/* ========== GROUP ROW ========== */
.tree-group-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm, 0.5rem);
  width: 100%;
  height: 36px;
  padding: 0 var(--spacing-sm, 0.5rem);
  background: var(--color-bg-secondary, #f9fafb);
  border: none;
  cursor: pointer;
  text-align: left;
  color: inherit;
  font-family: inherit;
  transition: background 0.15s ease;
}

.tree-group-row:hover {
  background: color-mix(in srgb, var(--color-primary, #3b82f6) 6%, var(--color-bg-secondary, #f9fafb));
}

/* Chevron */
.tree-group-row__chevron {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: var(--color-text-secondary, #6b7280);
  transition: transform 200ms ease;
}

.tree-group-row__chevron.is-collapsed {
  transform: rotate(-90deg);
}

/* Group Icon */
.tree-group-row__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.tree-group-row__icon svg {
  width: 16px;
  height: 16px;
}

.tree-group-row__icon--folder svg {
  color: var(--color-primary, #3b82f6);
}

.tree-group-row__icon--company svg {
  color: var(--color-text-secondary, #6b7280);
}

.tag-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

/* Group Name */
.tree-group-row__name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-primary, #111827);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Count Badge */
.tree-group-row__count {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-secondary, #6b7280);
  background: color-mix(in srgb, var(--color-text-secondary, #6b7280) 12%, transparent);
  padding: 1px 7px;
  border-radius: 9999px;
  flex-shrink: 0;
}

/* Subtitle */
.tree-group-row__subtitle {
  font-size: 0.75rem;
  color: var(--color-text-secondary, #6b7280);
  margin-left: auto;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ========== DASHBOARD ITEMS ========== */
.tree-group-items {
  overflow: hidden;
}

.tree-item {
  padding-left: calc(var(--spacing-sm, 0.5rem) + 24px);
}

.tree-item :deep(.list-item) {
  min-height: 40px;
}

/* ========== VIEW ALL ========== */
.tree-view-all {
  display: block;
  width: 100%;
  background: none;
  border: none;
  border-top: 1px solid var(--color-border-light, #e5e7eb);
  cursor: pointer;
  color: var(--color-primary, #3b82f6);
  font-size: 0.8rem;
  font-family: inherit;
  padding: var(--spacing-xs, 0.25rem) var(--spacing-sm, 0.5rem);
  padding-left: calc(var(--spacing-sm, 0.5rem) + 24px);
  text-align: right;

  &:hover {
    text-decoration: underline;
    background: var(--color-bg-secondary, #f9fafb);
  }
}

/* ========== COLLAPSE TRANSITION ========== */
.tree-collapse-enter-active,
.tree-collapse-leave-active {
  transition: opacity 200ms ease, max-height 200ms ease;
  max-height: 4000px;
  opacity: 1;
}

.tree-collapse-enter-from,
.tree-collapse-leave-to {
  max-height: 0;
  opacity: 0;
}

/* ========== EMPTY STATE ========== */
.tree-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: var(--color-text-secondary, #9ca3af);
  gap: 0.75rem;
}

.tree-empty svg {
  width: 2.5rem;
  height: 2.5rem;
}

.tree-empty p {
  font-size: 0.875rem;
  margin: 0;
}

/* ========== LOADING ========== */
.tree-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl, 2rem) 0;
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

/* ========== RESPONSIVE ========== */
@media (max-width: 768px) {
  .tree-group-row__subtitle {
    display: none;
  }

  .tree-item {
    padding-left: calc(var(--spacing-xs, 0.25rem) + 16px);
  }

  .tree-header__toggle {
    width: 16px;
  }

  /* Hide tags & folder columns on mobile */
  .tree-header__tags,
  .tree-header__folder {
    display: none;
  }

  .tree-header__company {
    min-width: 60px;
  }

  .tree-group-row__name {
    font-size: 0.8125rem;
  }
}
</style>
