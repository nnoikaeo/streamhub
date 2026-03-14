<template>
  <div class="folder-dropdown-filter">
    <svg class="folder-dropdown-filter__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
    <select
      class="folder-dropdown-filter__select"
      :value="modelValue ?? ''"
      @change="handleChange"
    >
      <option value="">โฟลเดอร์ทั้งหมด</option>
      <option
        v-for="folder in folders"
        :key="folder.id"
        :value="folder.id"
      >
        {{ indent(folder.level) }}{{ folder.name }} ({{ dashboardCounts[folder.id] ?? 0 }})
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
import type { Folder } from '~/types/dashboard'

withDefaults(defineProps<{
  folders: (Folder & { level?: number })[]
  modelValue: string | null
  dashboardCounts: Record<string, number>
}>(), {
  modelValue: null,
  dashboardCounts: () => ({}),
})

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
}>()

const indent = (level?: number) => {
  if (!level) return ''
  return '— '.repeat(level)
}

const handleChange = (event: Event) => {
  const value = (event.target as HTMLSelectElement).value
  emit('update:modelValue', value || null)
}
</script>

<style scoped>
.folder-dropdown-filter {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.folder-dropdown-filter__icon {
  width: 1.125rem;
  height: 1.125rem;
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

.folder-dropdown-filter__select {
  padding: 6px 12px;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  outline: none;
  transition: border-color var(--transition-fast);
  min-width: 180px;
}

.folder-dropdown-filter__select:hover {
  border-color: var(--color-border-default);
}

.folder-dropdown-filter__select:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(var(--color-primary-rgb, 59, 130, 246), 0.15);
}

@media (max-width: 768px) {
  .folder-dropdown-filter {
    width: 100%;
  }

  .folder-dropdown-filter__select {
    width: 100%;
    min-width: unset;
  }
}
</style>
