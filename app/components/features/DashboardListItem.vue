<template>
  <div
    class="list-item"
    role="button"
    tabindex="0"
    @click="$emit('view')"
    @keydown.enter="$emit('view')"
  >
    <!-- Color Swatch -->
    <div class="list-item__swatch" :style="{ background: swatchGradient }" />

    <!-- Name -->
    <span class="list-item__name">
      {{ dashboard.name }}
      <span v-if="dashboard.isArchived" class="archived-badge">เก็บถาวร</span>
    </span>

    <!-- Folder -->
    <div v-if="showFolder" class="list-item__folder">
      <span v-if="folderName" class="folder-chip">{{ folderName }}</span>
    </div>

    <!-- Tags -->
    <div v-if="showTags" class="list-item__tags">
      <TagBadge
        v-for="tag in visibleTags"
        :key="tag.id"
        :tag="tag"
        size="sm"
      />
      <span v-if="hiddenCount > 0" class="list-item__tags-more">+{{ hiddenCount }}</span>
    </div>

    <!-- Company Badge -->
    <div v-if="showCompany" class="list-item__company">
      <span v-if="companyKeys.length === 0" class="company-chip company-chip--global">ทุกบริษัท</span>
      <span v-else class="company-chip">{{ companyKeys.join(', ') }}</span>
    </div>

    <!-- Arrow -->
    <div class="list-item__arrow">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Dashboard } from '~/types/dashboard'
import type { Tag } from '~/types/tag'
import type { ListColumn } from './DashboardList.vue'
import { useTagStore } from '~/stores/tags'
import TagBadge from './TagBadge.vue'

const props = defineProps<{
  dashboard: Dashboard
  tags?: Tag[]
  visibleColumns?: ListColumn[]
  folderMap?: Record<string, string>
}>()

defineEmits<{ view: [] }>()

const tagStore = useTagStore()

const showFolder = computed(() => props.visibleColumns?.includes('folder') ?? false)
const showTags = computed(() => props.visibleColumns?.includes('tags') ?? true)
const showCompany = computed(() => props.visibleColumns?.includes('company') ?? true)

const folderName = computed(() => {
  if (!props.folderMap) return ''
  return props.folderMap[props.dashboard.folderId] ?? ''
})

const resolvedTags = computed<Tag[]>(() => {
  const tagIds = props.dashboard.tags
  if (!tagIds || tagIds.length === 0) return []
  // If parent provides a tags lookup array, filter to only this dashboard's tags
  if (props.tags && props.tags.length > 0) {
    const idSet = new Set(tagIds)
    return props.tags.filter((t) => idSet.has(t.id))
  }
  return tagStore.getTagsByIds(tagIds)
})

const visibleTags = computed(() => resolvedTags.value.slice(0, 2))
const hiddenCount = computed(() => Math.max(0, resolvedTags.value.length - 2))

const companyKeys = computed(() => {
  const access = props.dashboard.access
  if (!access?.company || access.company.length === 0) return []
  return access.company
})

// Gradient swatch derived from dashboard name (same algorithm as DashboardPreview)
const swatchGradient = computed(() => {
  const title = props.dashboard.name
  if (!title) return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  let hash = 0
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash % 360)
  return `linear-gradient(135deg, hsl(${hue}, 70%, 60%) 0%, hsl(${(hue + 60) % 360}, 70%, 40%) 100%)`
})
</script>

<style scoped>
.list-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm, 0.5rem);
  padding: var(--spacing-xs, 0.25rem) var(--spacing-sm, 0.5rem);
  min-height: 48px;
  cursor: pointer;
  transition: background 0.15s ease;
  border-bottom: 1px solid var(--color-border-light, #e5e7eb);
}

.list-item:last-child {
  border-bottom: none;
}

.list-item:hover {
  background: var(--color-bg-secondary, #f9fafb);
}

.list-item:focus-visible {
  outline: 2px solid var(--color-primary, #3b82f6);
  outline-offset: -2px;
}

/* ---- Color Swatch ---- */
.list-item__swatch {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm, 6px);
}

/* ---- Name ---- */
.list-item__name {
  flex: 1;
  min-width: 0;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-primary, #111827);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.archived-badge {
  flex-shrink: 0;
  font-size: 0.625rem;
  font-weight: 600;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  background: #fef3c7;
  color: #92400e;
  white-space: nowrap;
}

/* ---- Folder ---- */
.list-item__folder {
  flex-shrink: 0;
  width: 100px;
}

.folder-chip {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-primary, #3b82f6);
  background: color-mix(in srgb, var(--color-primary, #3b82f6) 10%, transparent);
  border-radius: var(--radius-sm, 4px);
  padding: 2px 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

/* ---- Tags ---- */
.list-item__tags {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
  width: 180px;
  overflow: hidden;
  flex-wrap: nowrap;
}

.list-item__tags :deep(.tag-badge) {
  max-width: 82px;
  overflow: hidden;
}

.list-item__tags :deep(.tag-badge__name) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.list-item__tags-more {
  font-size: 0.75rem;
  color: var(--color-text-secondary, #6b7280);
}

/* ---- Company ---- */
.list-item__company {
  flex-shrink: 0;
  width: 80px;
}

.company-chip {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-secondary, #6b7280);
  background: var(--color-bg-secondary, #f3f4f6);
  border-radius: var(--radius-sm, 4px);
  padding: 2px 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

.company-chip--global {
  color: var(--color-primary, #3b82f6);
  background: color-mix(in srgb, var(--color-primary, #3b82f6) 10%, transparent);
}

/* ---- Arrow ---- */
.list-item__arrow {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  color: var(--color-text-secondary, #9ca3af);
  transition: color 0.15s ease, transform 0.15s ease;
}

.list-item__arrow svg {
  width: 1rem;
  height: 1rem;
}

.list-item:hover .list-item__arrow {
  color: var(--color-primary, #3b82f6);
  transform: translateX(2px);
}

/* ---- Responsive ---- */
@media (max-width: 768px) {
  .list-item__folder {
    display: none;
  }

  .list-item__tags {
    display: none;
  }

  .list-item__company {
    min-width: 60px;
  }
}
</style>
