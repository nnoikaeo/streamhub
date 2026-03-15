<template>
  <div class="tag-filter">
    <div v-if="loading" class="tag-filter__loading">Loading tags...</div>
    <div v-else-if="tags.length === 0" class="tag-filter__empty">No tags available</div>
    <div v-else class="tag-filter__chips">
      <button
        v-for="tag in tags"
        :key="tag.id"
        class="tag-filter__chip"
        :class="{ 'tag-filter__chip--selected': isSelected(tag.id) }"
        :style="chipStyle(tag)"
        @click="toggle(tag.id)"
      >
        <span class="tag-filter__chip-dot" :style="{ backgroundColor: isSelected(tag.id) ? '#fff' : tag.color }" />
        {{ tag.name }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Tag } from '~/types/tag'

const props = withDefaults(defineProps<{
  tags: Tag[]
  selectedTagIds: string[]
  loading?: boolean
}>(), {
  loading: false,
})

const emit = defineEmits<{
  'update:selectedTagIds': [ids: string[]]
}>()

const isSelected = (tagId: string) => props.selectedTagIds.includes(tagId)

const toggle = (tagId: string) => {
  const current = [...props.selectedTagIds]
  const index = current.indexOf(tagId)
  if (index === -1) {
    current.push(tagId)
  } else {
    current.splice(index, 1)
  }
  emit('update:selectedTagIds', current)
}

const chipStyle = (tag: Tag) => {
  if (isSelected(tag.id)) {
    return {
      backgroundColor: tag.color,
      color: '#ffffff',
      borderColor: tag.color,
    }
  }
  return {
    backgroundColor: 'transparent',
    color: tag.color,
    borderColor: tag.color,
    '--chip-hover-bg': `${tag.color}1a`, // 10% opacity
  }
}
</script>

<style scoped>
.tag-filter__chips {
  display: flex;
  flex-wrap: nowrap;
  gap: var(--spacing-xs);
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: thin;
}

.tag-filter__chips::-webkit-scrollbar {
  height: 4px;
}

.tag-filter__chips::-webkit-scrollbar-thumb {
  background-color: var(--color-border-default);
  border-radius: 2px;
}

.tag-filter__chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 12px;
  border-radius: 9999px;
  border: 1px solid;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: background-color var(--transition-fast), color var(--transition-fast);
  background: none;
}

.tag-filter__chip:not(.tag-filter__chip--selected):hover {
  background-color: var(--chip-hover-bg, rgba(0, 0, 0, 0.05));
}

.tag-filter__chip--selected {
  font-weight: 600;
}

.tag-filter__chip-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.tag-filter__loading,
.tag-filter__empty {
  font-size: 13px;
  color: var(--color-text-secondary);
}
</style>
