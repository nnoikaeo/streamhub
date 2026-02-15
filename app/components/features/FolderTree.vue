<template>
  <div class="folder-tree">
    <!-- Folder Tree Items -->
    <ul class="tree-list">
      <li v-for="folder in folders" :key="folder.id" class="tree-item">
        <!-- Folder Item -->
        <div
          class="folder-row"
          :class="{ 'folder-selected': isSelected(folder.id) }"
          @click="selectFolder(folder)"
        >
          <!-- Expand/Collapse Button -->
          <button
            v-if="folder.children && folder.children.length > 0"
            type="button"
            class="expand-btn"
            :class="{ 'expand-open': expandedFolders.has(folder.id) }"
            @click.stop="toggleExpand(folder.id)"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8.59 16.58L10 18l6-6-6-6-1.41 1.41L13.17 12z" />
            </svg>
          </button>

          <!-- Folder Icon -->
          <div class="folder-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"
              />
            </svg>
          </div>

          <!-- Folder Name -->
          <span class="folder-name">{{ folder.name }}</span>

          <!-- Optional Badge (item count) -->
          <span v-if="folder.children && folder.children.length > 0" class="folder-count">
            {{ folder.children.length }}
          </span>
        </div>

        <!-- Nested Children (Recursive) -->
        <FolderTree
          v-if="expandedFolders.has(folder.id) && folder.children && folder.children.length > 0"
          :folders="folder.children"
          :selected-folder-id="selectedFolderId"
          :expanded-folders="expandedFolders"
          class="tree-nested"
          @select="$emit('select', $event)"
          @expand="$emit('expand', $event)"
        />
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
// FolderTree component - Badge alignment fix (CSS transform)
import { type Folder } from '~/types/dashboard'
import { ref } from 'vue'

/**
 * FolderTree - Recursive folder tree component
 *
 * Features:
 * - Recursive folder structure
 * - Expand/collapse folders
 * - Click to select folder
 * - Item count badges
 * - Visual hierarchy with indentation
 * - Keyboard accessible
 *
 * v3.1 Design: Shows FOLDERS ONLY (no dashboards)
 *
 * Events:
 * - select: User selected a folder
 * - expand: User expanded a folder
 *
 * Usage:
 * <FolderTree
 *   :folders="mockFolders"
 *   :selected-folder-id="activeFolder"
 *   @select="handleFolderSelect"
 *   @expand="handleFolderExpand"
 * />
 */

interface Props {
  /**
   * Array of folder objects
   */
  folders: Folder[]

  /**
   * Currently selected folder ID
   */
  selectedFolderId?: string | null

  /**
   * Set of expanded folder IDs
   */
  expandedFolders?: Set<string>
}

const props = withDefaults(defineProps<Props>(), {
  selectedFolderId: null,
  expandedFolders: () => new Set(),
})

const emit = defineEmits<{
  select: [folder: Folder]
  expand: [folderId: string]
}>()

// Local expanded state if not provided
const localExpandedFolders = ref<Set<string>>(
  props.expandedFolders instanceof Set ? props.expandedFolders : new Set(),
)

const expandedFolders = props.expandedFolders instanceof Set ? props.expandedFolders : localExpandedFolders.value

/**
 * Check if folder is selected
 */
const isSelected = (folderId: string): boolean => {
  return folderId === props.selectedFolderId
}

/**
 * Toggle folder expansion
 * Emit event to let parent (FolderSidebar) handle the state change
 * This prevents direct mutation of props and ensures state is managed in store
 */
const toggleExpand = (folderId: string) => {
  emit('expand', folderId)
}

/**
 * Select folder
 */
const selectFolder = (folder: Folder) => {
  emit('select', folder)
  // Auto-expand when selecting a folder
  if (folder.children && folder.children.length > 0 && !expandedFolders.has(folder.id)) {
    emit('expand', folder.id)
  }
}
</script>

<style scoped>
.folder-tree {
  width: 100%;
  overflow: hidden;
}

/* ========== TREE LIST ========== */
.tree-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.tree-item {
  list-style: none;
}

/* ========== FOLDER ROW ========== */
.folder-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 0.75rem;
  padding-right: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  box-sizing: border-box;

  &:hover {
    background-color: #f3f4f6;
  }

  &.folder-selected {
    background-color: #eff6ff;
    border-left: 2px solid #3b82f6;
    padding-left: calc(0.75rem - 2px);
    color: #1d4ed8;
    font-weight: 500;
  }
}

/* ========== EXPAND BUTTON ========== */
.expand-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  padding: 0;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--color-text-secondary);
  transition: transform 0.2s ease;
  flex-shrink: 0;
  outline: none;

  &:hover {
    color: var(--color-text-primary);
  }

  &.expand-open {
    transform: rotate(90deg);
  }
}

.expand-btn :deep(svg) {
  width: 1rem;
  height: 1rem;
  fill: currentColor;
}

/* Empty expand button for items without children */
.expand-btn:disabled {
  opacity: 0;
  cursor: default;
}

/* ========== FOLDER ICON ========== */
.folder-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
  color: #f59e0b;
  flex-shrink: 0;
}

.folder-icon :deep(svg) {
  width: 100%;
  height: 100%;
  fill: currentColor;
}

/* ========== FOLDER NAME ========== */
.folder-name {
  flex: 1;
  min-width: 0;  /* Allow flex item to shrink below content size */
  font-size: 0.875rem;
  color: inherit;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ========== ITEM COUNT BADGE ========== */
.folder-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.5rem;
  height: 1.5rem;
  padding: 0 0.375rem;
  background-color: #e5e7eb;
  color: #6b7280;
  font-size: 0.7rem;
  font-weight: 600;
  text-align: center;
  border-radius: 9999px;
  flex-shrink: 0;
  transition: all 0.2s ease;
  /* Align badge to right edge - margin-left: auto pushes to end */
  margin-left: auto;
  margin-right: 0.75rem;
}

.folder-row:hover .folder-count {
  background-color: #d1d5db;
}

.folder-row.folder-selected .folder-count {
  background-color: #dbeafe;
  color: #0c4a6e;
}

/* ========== NESTED ITEMS ========== */
.tree-nested {
  border-left: 1px solid #e5e7eb;
  padding-left: 0;
  margin-left: 1.5rem;
  max-width: calc(100% - 1.5rem);
  box-sizing: border-box;
  /* Use margin-left to indent, this changes actual layout flow */
  /* ensuring badges align vertically in flex container */
}

/* ========== RESPONSIVE ========== */
@media (max-width: 768px) {
  .folder-row {
    padding: 0.375rem 0.5rem;
    padding-right: 1.75rem;
    font-size: 0.875rem;
  }

  .tree-nested {
    margin-left: 1rem;
    max-width: calc(100% - 1rem);
  }
}
</style>
