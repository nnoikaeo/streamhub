<template>
  <div class="tag-selector" ref="selectorRef">
    <!-- Selected tags as removable badges -->
    <div class="tag-selector__current">
      <TagBadge
        v-for="tag in selectedTags"
        :key="tag.id"
        :tag="tag"
        size="sm"
        :removable="true"
        @remove="removeTag(tag.id)"
      />
      <button class="tag-selector__add-btn" @click="toggleDropdown">+ Add tag</button>
    </div>

    <!-- Dropdown -->
    <div v-if="isOpen" class="tag-selector__dropdown">
      <!-- Search -->
      <input
        ref="searchRef"
        v-model="search"
        class="tag-selector__search"
        placeholder="Search tags..."
        type="text"
      />

      <!-- Tag list -->
      <ul class="tag-selector__list">
        <li
          v-for="tag in filteredTags"
          :key="tag.id"
          class="tag-selector__item"
          @click="toggleTag(tag.id)"
        >
          <span class="tag-selector__checkbox" :class="{ 'tag-selector__checkbox--checked': isSelected(tag.id) }">
            <span v-if="isSelected(tag.id)">✓</span>
          </span>
          <span class="tag-selector__dot" :style="{ backgroundColor: tag.color }" />
          <span class="tag-selector__item-name">{{ tag.name }}</span>
        </li>
        <li v-if="filteredTags.length === 0 && !canCreateTag" class="tag-selector__empty">
          No matching tags found.
        </li>
      </ul>

      <!-- Footer -->
      <div class="tag-selector__footer">
        <template v-if="canCreateTag">
          <button
            v-if="search.trim()"
            class="tag-selector__create-btn"
            @click="createTag"
          >
            + Create "{{ search.trim() }}"
          </button>
          <span v-else class="tag-selector__hint">Type a name to create a new tag</span>
        </template>
        <span v-else class="tag-selector__contact">⚠️ Need a new tag? Contact Admin</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick, onMounted, onUnmounted } from 'vue'
import type { Tag } from '~/types/tag'
import TagBadge from './TagBadge.vue'

const props = withDefaults(defineProps<{
  modelValue: string[]
  availableTags: Tag[]
  canCreateTag?: boolean
}>(), {
  canCreateTag: false,
})

const emit = defineEmits<{
  'update:modelValue': [ids: string[]]
  'create-tag': [name: string]
}>()

const isOpen = ref(false)
const search = ref('')
const selectorRef = ref<HTMLElement | null>(null)
const searchRef = ref<HTMLInputElement | null>(null)

const selectedTags = computed(() =>
  props.modelValue
    .map((id) => props.availableTags.find((t) => t.id === id))
    .filter(Boolean) as Tag[]
)

const filteredTags = computed(() => {
  const q = search.value.toLowerCase()
  return props.availableTags.filter((t) => t.name.toLowerCase().includes(q))
})

const isSelected = (tagId: string) => props.modelValue.includes(tagId)

const toggleTag = (tagId: string) => {
  const current = [...props.modelValue]
  const index = current.indexOf(tagId)
  if (index === -1) {
    current.push(tagId)
  } else {
    current.splice(index, 1)
  }
  emit('update:modelValue', current)
}

const removeTag = (tagId: string) => {
  emit('update:modelValue', props.modelValue.filter((id) => id !== tagId))
}

const toggleDropdown = async () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    search.value = ''
    await nextTick()
    searchRef.value?.focus()
  }
}

const createTag = () => {
  const name = search.value.trim()
  if (name) {
    emit('create-tag', name)
    search.value = ''
    isOpen.value = false
  }
}

// Close on outside click
const handleOutsideClick = (e: MouseEvent) => {
  if (selectorRef.value && !selectorRef.value.contains(e.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => document.addEventListener('mousedown', handleOutsideClick))
onUnmounted(() => document.removeEventListener('mousedown', handleOutsideClick))
</script>

<style scoped>
.tag-selector {
  position: relative;
}

.tag-selector__current {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-xs);
  min-height: 32px;
}

.tag-selector__add-btn {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 9999px;
  border: 1px dashed var(--color-border-default);
  background: none;
  color: var(--color-text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.tag-selector__add-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.tag-selector__dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 100;
  width: 280px;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  overflow: hidden;
}

.tag-selector__search {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border: none;
  border-bottom: 1px solid var(--color-border-light);
  font-size: 13px;
  outline: none;
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  box-sizing: border-box;
}

.tag-selector__list {
  list-style: none;
  margin: 0;
  padding: var(--spacing-xs) 0;
  max-height: 200px;
  overflow-y: auto;
}

.tag-selector__item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 6px var(--spacing-md);
  cursor: pointer;
  font-size: 13px;
  color: var(--color-text-primary);
  transition: background-color var(--transition-fast);
}

.tag-selector__item:hover {
  background-color: var(--color-bg-secondary);
}

.tag-selector__checkbox {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: 1px solid var(--color-border-default);
  border-radius: 3px;
  font-size: 10px;
  flex-shrink: 0;
  color: var(--color-text-inverse);
}

.tag-selector__checkbox--checked {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
}

.tag-selector__dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.tag-selector__item-name {
  flex: 1;
}

.tag-selector__empty {
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: 13px;
  color: var(--color-text-secondary);
}

.tag-selector__footer {
  padding: var(--spacing-sm) var(--spacing-md);
  border-top: 1px solid var(--color-border-light);
}

.tag-selector__create-btn {
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  padding: 0;
  font-size: 13px;
  color: var(--color-primary);
  cursor: pointer;
  font-weight: 500;
}

.tag-selector__create-btn:hover {
  text-decoration: underline;
}

.tag-selector__contact,
.tag-selector__hint {
  font-size: 12px;
  color: var(--color-text-secondary);
}
</style>
