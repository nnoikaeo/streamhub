<script setup lang="ts">
/**
 * FolderCheckboxTree Component
 *
 * Renders a flat list of folders as a nested checkbox tree based on parentId.
 * Used in UserForm to let admins pick which folders a moderator manages.
 *
 * - Checkboxes are independent (no cascade to children)
 * - Only active folders should be passed in (caller filters)
 */

import type { Folder } from '~/types/dashboard'
import { computed } from 'vue'

interface Props {
  folders: Folder[]
  modelValue: string[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

type FolderNode = Folder & { children: FolderNode[]; depth: number }

const tree = computed<FolderNode[]>(() => {
  const map = new Map<string, FolderNode>()
  for (const f of props.folders) {
    map.set(f.id, { ...f, children: [], depth: 0 })
  }

  const roots: FolderNode[] = []
  for (const f of props.folders) {
    const node = map.get(f.id)!
    if (f.parentId && map.has(f.parentId)) {
      const parent = map.get(f.parentId)!
      node.depth = parent.depth + 1
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  }

  // Flatten to a pre-order list, recomputing depth from nesting
  const flat: FolderNode[] = []
  const walk = (node: FolderNode, depth: number) => {
    node.depth = depth
    flat.push(node)
    for (const child of node.children) walk(child, depth + 1)
  }
  for (const r of roots) walk(r, 0)
  return flat
})

const toggle = (id: string, checked: boolean) => {
  const set = new Set(props.modelValue)
  if (checked) set.add(id)
  else set.delete(id)
  emit('update:modelValue', Array.from(set))
}

const isChecked = (id: string) => props.modelValue.includes(id)
</script>

<template>
  <div class="folder-tree">
    <p v-if="tree.length === 0" class="folder-tree__empty">
      ไม่มีโฟลเดอร์ที่ใช้งานได้
    </p>
    <div
      v-for="node in tree"
      :key="node.id"
      class="folder-tree__item"
      :style="{ paddingLeft: `${node.depth * 1.25}rem` }"
    >
      <input
        :id="`folder-check-${node.id}`"
        type="checkbox"
        :checked="isChecked(node.id)"
        class="folder-tree__checkbox"
        @change="(e: any) => toggle(node.id, e.target.checked)"
      />
      <label :for="`folder-check-${node.id}`" class="folder-tree__label">
        <span v-if="node.depth > 0" class="folder-tree__prefix">└──</span>
        📁 {{ node.name }}
      </label>
    </div>
  </div>
</template>

<style scoped>
.folder-tree {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs, 0.25rem);
  padding: var(--spacing-md, 1rem);
  background-color: var(--color-bg-secondary, #f3f4f6);
  border: 1px solid var(--color-border-light, #e5e7eb);
  border-radius: var(--radius-md, 0.375rem);
  max-height: 240px;
  overflow-y: auto;
}

.folder-tree__empty {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-secondary, #6b7280);
  font-style: italic;
  text-align: center;
}

.folder-tree__item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm, 0.5rem);
}

.folder-tree__checkbox {
  width: 1.125rem;
  height: 1.125rem;
  cursor: pointer;
  accent-color: var(--color-primary, #3b82f6);
  flex-shrink: 0;
}

.folder-tree__label {
  cursor: pointer;
  user-select: none;
  font-size: 0.9375rem;
  color: var(--color-text-primary, #1f2937);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs, 0.25rem);
}

.folder-tree__prefix {
  color: var(--color-text-secondary, #9ca3af);
  font-family: monospace;
}
</style>
