<template>
  <button
    type="button"
    class="group-divider"
    :class="[
      `group-divider--${size}`,
      { 'is-collapsed': collapsed }
    ]"
    :aria-expanded="!collapsed"
    :aria-label="`กลุ่ม ${group.name} (${group.dashboards.length} แดชบอร์ด)`"
    :title="`${group.name} — ${group.dashboards.length} แดชบอร์ด`"
    @click="$emit('toggle')"
  >
    <!-- Chevron -->
    <svg
      class="group-divider__chevron"
      :class="{ 'is-collapsed': collapsed }"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>

    <!-- Icon (folder / tag dot / company) -->
    <span v-if="group.icon === 'folder'" class="group-divider__icon group-divider__icon--folder">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    </span>
    <span
      v-else-if="group.icon === 'tag'"
      class="group-divider__icon group-divider__icon--tag"
    >
      <span class="tag-dot" :style="{ background: group.color || 'var(--color-text-secondary)' }" />
    </span>
    <span v-else-if="group.icon === 'company'" class="group-divider__icon group-divider__icon--company">
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

    <!-- Name -->
    <span class="group-divider__name">{{ group.name }}</span>

    <!-- Count -->
    <span class="group-divider__count">({{ group.dashboards.length }})</span>

    <!-- Divider line fills remaining space -->
    <span class="group-divider__line" aria-hidden="true" />

    <!-- Subtitle (hidden in compact size, shown as tooltip instead) -->
    <span
      v-if="group.subtitle && size !== 'compact'"
      class="group-divider__subtitle"
    >
      {{ group.subtitle }}
    </span>
  </button>
</template>

<script setup lang="ts">
import type { DisplayGroup } from '~/types/dashboard'

withDefaults(defineProps<{
  group: DisplayGroup
  collapsed?: boolean
  /** 'default' = grid (h=28px), 'compact' = compact view (h=24px) */
  size?: 'default' | 'compact'
}>(), {
  collapsed: false,
  size: 'default',
})

defineEmits<{
  toggle: []
}>()
</script>

<style scoped>
.group-divider {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs, 0.25rem);
  width: 100%;
  background: var(--color-bg-secondary, #f9fafb);
  border: none;
  border-bottom: 1px solid var(--color-border-light, #e5e7eb);
  cursor: pointer;
  color: inherit;
  padding: 0 var(--spacing-sm, 0.5rem);
  text-align: left;
  font-family: inherit;
  transition: background-color 150ms ease;
}

.group-divider:hover {
  background: var(--color-bg-hover, #f3f4f6);
}

/* ========== SIZE VARIANTS ========== */
.group-divider--default {
  height: 28px;
}

.group-divider--compact {
  height: 24px;
}

/* ========== CHEVRON ========== */
.group-divider__chevron {
  width: 14px;
  height: 14px;
  color: var(--color-text-secondary, #6b7280);
  flex-shrink: 0;
  transition: transform 200ms ease;
}

.group-divider__chevron.is-collapsed {
  transform: rotate(-90deg);
}

/* ========== ICONS ========== */
.group-divider__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.group-divider__icon svg {
  width: 14px;
  height: 14px;
}

.group-divider__icon--folder {
  color: var(--color-primary, #3b82f6);
}

.group-divider__icon--tag {
  display: flex;
  align-items: center;
}

.tag-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.group-divider__icon--company {
  color: var(--color-text-secondary, #6b7280);
}

/* ========== TEXT ========== */
.group-divider__name {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text-primary, #1f2937);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.group-divider__count {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-secondary, #6b7280);
  flex-shrink: 0;
}

/* ========== DIVIDER LINE ========== */
.group-divider__line {
  flex: 1;
  min-width: 20px;
  height: 1px;
  background: var(--color-border-light, #e5e7eb);
}

/* ========== SUBTITLE ========== */
.group-divider__subtitle {
  font-size: 0.75rem;
  color: var(--color-text-secondary, #6b7280);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
  flex-shrink: 0;
}

/* ========== COMPACT ADJUSTMENTS ========== */
.group-divider--compact .group-divider__chevron {
  width: 12px;
  height: 12px;
}

.group-divider--compact .group-divider__icon svg {
  width: 12px;
  height: 12px;
}

.group-divider--compact .tag-dot {
  width: 7px;
  height: 7px;
}

.group-divider--compact .group-divider__name {
  font-size: 0.75rem;
  max-width: 160px;
}

.group-divider--compact .group-divider__count {
  font-size: 0.6875rem;
}

/* ========== RESPONSIVE ========== */
@media (max-width: 768px) {
  .group-divider__subtitle {
    display: none;
  }

  .group-divider__name {
    max-width: 140px;
  }
}
</style>
