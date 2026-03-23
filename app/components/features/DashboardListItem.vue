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
    <span class="list-item__name">{{ dashboard.name }}</span>

    <!-- Tags -->
    <div class="list-item__tags">
      <TagBadge
        v-for="tag in visibleTags"
        :key="tag.id"
        :tag="tag"
        size="sm"
      />
      <span v-if="hiddenCount > 0" class="list-item__tags-more">+{{ hiddenCount }}</span>
    </div>

    <!-- Company Badge -->
    <div class="list-item__company">
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
import { useTagStore } from '~/stores/tags'
import TagBadge from './TagBadge.vue'

const props = defineProps<{
  dashboard: Dashboard
  tags?: Tag[]
}>()

defineEmits<{ view: [] }>()

const tagStore = useTagStore()

const resolvedTags = computed<Tag[]>(() => {
  if (props.tags && props.tags.length > 0) return props.tags
  const tagIds = props.dashboard.tags
  if (!tagIds || tagIds.length === 0) return []
  return tagStore.getTagsByIds(tagIds)
})

const visibleTags = computed(() => resolvedTags.value.slice(0, 2))
const hiddenCount = computed(() => Math.max(0, resolvedTags.value.length - 2))

const companyKeys = computed(() => {
  const access = props.dashboard.access
  if (!access?.company) return []
  return Object.keys(access.company)
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
}

/* ---- Tags ---- */
.list-item__tags {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
  min-width: 120px;
}

.list-item__tags-more {
  font-size: 0.75rem;
  color: var(--color-text-secondary, #6b7280);
}

/* ---- Company ---- */
.list-item__company {
  flex-shrink: 0;
  min-width: 80px;
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
  .list-item__tags {
    display: none;
  }

  .list-item__company {
    min-width: 60px;
  }
}
</style>
