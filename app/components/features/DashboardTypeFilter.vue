<template>
  <div class="type-filter" role="group" aria-label="ชนิดแดชบอร์ด">
    <button
      v-for="type in DASHBOARD_TYPES"
      :key="type"
      type="button"
      class="type-filter__chip"
      :class="[`type-filter__chip--${type}`, { 'type-filter__chip--selected': modelValue.includes(type) }]"
      :aria-pressed="modelValue.includes(type)"
      @click="toggle(type)"
    >
      <DashboardTypeIcon :type="type" class="type-filter__icon" />
      {{ DASHBOARD_TYPE_LABELS[type] }}
    </button>
  </div>
</template>

<script setup lang="ts">
/**
 * Looker Studio / Google Sheets chips for Discover. Same behaviour and shape
 * as the tag chips next to it — nothing selected shows both, a click selects,
 * a second click deselects — so it reads as more of the same control.
 */

import type { DashboardType } from '~/types/dashboard'
import DashboardTypeIcon from '~/components/features/DashboardTypeIcon.vue'
import { DASHBOARD_TYPES, DASHBOARD_TYPE_LABELS } from '~/utils/typeFilter'

const props = defineProps<{
  modelValue: DashboardType[]
}>()

const emit = defineEmits<{
  'update:modelValue': [types: DashboardType[]]
}>()

const toggle = (type: DashboardType) => {
  const next = props.modelValue.includes(type)
    ? props.modelValue.filter((t) => t !== type)
    : [...props.modelValue, type]
  emit('update:modelValue', DASHBOARD_TYPES.filter((t) => next.includes(t)))
}
</script>

<style scoped>
.type-filter {
  display: flex;
  gap: var(--spacing-xs);
  flex-shrink: 0;
}

/* Registered in main.css's global button rule as [class*="type-filter__"] */
.type-filter__chip {
  --chip-color: var(--color-primary);
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 12px;
  border: 1px solid var(--chip-color);
  border-radius: 9999px;
  background: transparent;
  color: var(--chip-color);
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color var(--transition-fast), color var(--transition-fast);
}

/* Google Sheets green, as on DashboardCard */
.type-filter__chip--sheet {
  --chip-color: #0f9d58;
}

.type-filter__chip:not(.type-filter__chip--selected):hover {
  background: color-mix(in srgb, var(--chip-color) 10%, transparent);
}

.type-filter__chip--selected {
  background: var(--chip-color);
  color: #fff;
  font-weight: 600;
}

.type-filter__icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}
</style>
