<template>
  <span class="tag-badge" :class="`tag-badge--${size}`" :style="badgeStyle">
    <span class="tag-badge__dot" :style="{ backgroundColor: tag.color }" />
    <span class="tag-badge__name">{{ tag.name }}</span>
    <button v-if="removable" class="tag-badge__remove" @click.stop="$emit('remove')">✕</button>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Tag } from '~/types/tag'

const props = withDefaults(defineProps<{
  tag: Tag
  size?: 'sm' | 'md'
  removable?: boolean
}>(), {
  size: 'sm',
  removable: false,
})

defineEmits<{ remove: [] }>()

const badgeStyle = computed(() => ({
  backgroundColor: `${props.tag.color}26`, // 15% opacity (hex 26 ≈ 15%)
  color: props.tag.color,
  borderColor: props.tag.color,
}))
</script>

<style scoped>
.tag-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 1px solid;
  font-weight: 500;
  white-space: nowrap;
  cursor: default;
}

.tag-badge--sm {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
}

.tag-badge--md {
  font-size: 14px;
  padding: 4px 12px;
  border-radius: 14px;
}

.tag-badge__dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.tag-badge__name {
  line-height: 1;
}

.tag-badge__remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  padding: 0;
  margin-left: 2px;
  color: inherit;
  cursor: pointer;
  font-size: 10px;
  opacity: 0.7;
  line-height: 1;
  transition: opacity var(--transition-fast);
}

.tag-badge__remove:hover {
  opacity: 1;
}
</style>
