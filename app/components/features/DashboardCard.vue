<template>
  <div
    class="dashboard-card"
    :class="{ 'dashboard-card--compact': compact }"
    :role="compact ? 'button' : undefined"
    :tabindex="compact ? 0 : undefined"
    :title="compact ? companyTooltip : undefined"
    @click="compact ? $emit('view') : undefined"
    @keydown.enter="compact ? $emit('view') : undefined"
  >
    <!-- Dashboard Preview Thumbnail -->
    <DashboardPreview
      :embed-url="dashboard.lookerEmbedUrl"
      :title="dashboard.name"
      :dashboard-id="dashboard.id"
      mode="thumbnail"
      :height="compact ? 80 : 160"
    />

    <!-- Card Header with Icon -->
    <div class="card-header">
      <h3 class="card-title">{{ dashboard.name }}</h3>
      <div class="card-icon">
        <!-- Performance -->
        <svg v-if="dashboardIconType === 'performance'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        <!-- Geographic -->
        <svg v-else-if="dashboardIconType === 'geographic'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="7" height="9" />
          <rect x="14" y="3" width="7" height="5" />
          <rect x="14" y="12" width="7" height="9" />
          <rect x="3" y="16" width="7" height="5" />
        </svg>
        <!-- Forecast -->
        <svg v-else-if="dashboardIconType === 'forecast'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
        </svg>
        <!-- Default: Analysis -->
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      </div>
    </div>

    <!-- Company Badges -->
    <div class="card-companies">
      <span
        v-if="companyKeys.length === 0"
        class="company-badge company-badge--global"
      >
        <svg class="company-badge__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="4" y="2" width="16" height="20" rx="1" />
          <line x1="9" y1="6" x2="9" y2="6.01" />
          <line x1="15" y1="6" x2="15" y2="6.01" />
          <line x1="9" y1="10" x2="9" y2="10.01" />
          <line x1="15" y1="10" x2="15" y2="10.01" />
          <line x1="9" y1="14" x2="15" y2="14" />
          <line x1="9" y1="18" x2="15" y2="18" />
        </svg>
        <span>ทุกบริษัท</span>
      </span>
      <span
        v-for="code in companyKeys"
        :key="code"
        class="company-badge"
      >
        <svg class="company-badge__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="4" y="2" width="16" height="20" rx="1" />
          <line x1="9" y1="6" x2="9" y2="6.01" />
          <line x1="15" y1="6" x2="15" y2="6.01" />
          <line x1="9" y1="10" x2="9" y2="10.01" />
          <line x1="15" y1="10" x2="15" y2="10.01" />
          <line x1="9" y1="14" x2="15" y2="14" />
          <line x1="9" y1="18" x2="15" y2="18" />
        </svg>
        <span>{{ code }}</span>
      </span>
    </div>

    <!-- Tags -->
    <div v-if="visibleTags.length > 0" class="card-tags">
      <TagBadge
        v-for="tag in visibleTags"
        :key="tag.id"
        :tag="tag"
        size="sm"
      />
      <span v-if="hiddenCount > 0" class="card-tags__more">+{{ hiddenCount }}</span>
    </div>

    <!-- Open Button - Hidden in compact mode (whole card is clickable) -->
    <button v-if="!compact" class="open-button" @click="$emit('view')">
      <span>เปิด</span>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Dashboard } from '../../types/dashboard'
import type { Tag } from '../../types/tag'
import { useTagStore } from '~/stores/tags'
import TagBadge from './TagBadge.vue'
import DashboardPreview from './DashboardPreview.vue'

/**
 * DashboardCard - Individual dashboard card component
 * Uses StreamHub theme CSS variables for consistent styling
 */

interface Props {
  dashboard: Dashboard
  tags?: Tag[]
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  compact: false,
})

const MAX_VISIBLE_TAGS = computed(() => props.compact ? 2 : 3)

defineEmits<{
  view: []
}>()

const tagStore = useTagStore()

// Resolve tags: use prop if provided, otherwise resolve from store via dashboard.tags (string[])
const resolvedTags = computed<Tag[]>(() => {
  const tagIds = props.dashboard.tags
  if (!tagIds || tagIds.length === 0) return []
  if (props.tags && props.tags.length > 0) {
    const idSet = new Set(tagIds)
    return props.tags.filter((t) => idSet.has(t.id))
  }
  return tagStore.getTagsByIds(tagIds)
})

// Company codes from access.company array
const companyKeys = computed(() => {
  const access = props.dashboard.access
  if (!access?.company || access.company.length === 0) return []
  return access.company
})

const visibleTags = computed(() => resolvedTags.value.slice(0, MAX_VISIBLE_TAGS.value))
const hiddenCount = computed(() => Math.max(0, resolvedTags.value.length - MAX_VISIBLE_TAGS.value))

// Company tooltip text for compact mode
const companyTooltip = computed(() => {
  if (companyKeys.value.length === 0) return 'ทุกบริษัท'
  return companyKeys.value.join(', ')
})

// Dashboard icon type for template v-if switch
const dashboardIconType = computed(() => props.dashboard.type || 'analysis')
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
  padding: 0;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.dashboard-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
  border-color: var(--color-border-default);
}

/* Card content below preview uses padding */
.card-header,
.card-companies,
.card-tags,
.open-button {
  padding-left: var(--spacing-md);
  padding-right: var(--spacing-md);
}

.card-header {
  padding-top: var(--spacing-md);
}

.open-button {
  padding-bottom: var(--spacing-md);
  margin-left: var(--spacing-md);
  margin-right: var(--spacing-md);
  width: calc(100% - 2 * var(--spacing-md));
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

/* ========== COMPANY BADGES ========== */
.card-companies {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.company-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 8px;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
  color: #475569;
  line-height: 1;
}

.company-badge--global {
  background: #ede9fe;
  border-color: #c4b5fd;
  color: #6d28d9;
}

.company-badge__icon {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
}

/* ========== TAGS ========== */
.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.card-tags__more {
  font-size: 11px;
  color: var(--color-text-secondary);
  font-weight: 500;
  padding: 2px 6px;
  background-color: var(--color-bg-secondary);
  border-radius: 10px;
  border: 1px solid var(--color-border-light);
}

/* ========== OPEN BUTTON ========== */
.open-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
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

/* ========== COMPACT MODE ========== */
.dashboard-card--compact {
  cursor: pointer;
  padding-bottom: var(--spacing-sm);
}

.dashboard-card--compact .card-header,
.dashboard-card--compact .card-tags {
  padding-left: var(--spacing-sm);
  padding-right: var(--spacing-sm);
}

.dashboard-card--compact .card-header {
  padding-top: var(--spacing-sm);
}

.dashboard-card--compact .card-title {
  font-size: 0.8rem;
}

.dashboard-card--compact .card-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.dashboard-card--compact .card-icon svg {
  width: 1rem;
  height: 1rem;
}
</style>
