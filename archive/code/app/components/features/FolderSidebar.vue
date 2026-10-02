<template>
  <div class="folder-sidebar">
    <!-- Main Navigation Menu -->
    <div v-if="showMainMenu && mainMenuItems.length" class="sidebar-section">
      <div class="sidebar-header">
        <h3 class="sidebar-title">เมนูหลัก</h3>
      </div>
      <nav class="main-nav">
        <NuxtLink
          v-for="item in mainMenuItems"
          :key="item.to"
          :to="item.to"
          class="nav-item"
          active-class="nav-item--active"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-label">{{ item.label }}</span>
        </NuxtLink>
      </nav>
    </div>

    <!-- Folders Section -->
    <div v-if="showFolders" class="sidebar-section">
      <div class="sidebar-header">
        <h3 class="sidebar-title">โฟลเดอร์</h3>
      </div>

      <!-- Search Bar -->
      <div v-if="allowSearch" class="sidebar-search">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="ค้นหาโฟลเดอร์..."
          class="search-input"
        >
      </div>

      <!-- Folder Tree -->
      <div class="sidebar-content">
        <FolderTree
          :folders="filteredFolders"
          :selected-folder-id="selectedFolderId"
          :expanded-folders="expandedFolders"
          @select="handleFolderSelect"
          @expand="handleFolderExpand"
        />
      </div>
    </div>

    <!-- Sidebar Footer (Optional) -->
    <div v-if="$slots.footer" class="sidebar-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, unref } from 'vue'
import type { Folder } from '~/types/dashboard'
import { useDashboardStore } from '~/stores/dashboard'
import FolderTree from './FolderTree.vue'

/**
 * FolderSidebar - Sidebar wrapper for folder tree with main navigation
 *
 * Features:
 * - Main menu navigation (Dashboard, Discover)
 * - Folder tree with search
 * - Create folder button
 * - Expand/collapse management
 * - Selection management
 * - Footer slot for additional actions
 *
 * Events:
 * - select-folder: User selected a folder
 *
 * Usage:
 * <FolderSidebar
 *   :folders="mockFolders"
 *   :show-main-menu="true"
 *   :main-menu-items="[{ label: 'หน้าแรก', icon: '🏠', to: '/dashboard' }]"
 *   :selected-folder-id="activeFolderId"
 *   @select-folder="handleSelectFolder"
 * />
 */

interface MenuItem {
  label: string
  icon: string
  to: string
}

interface Props {
  /**
   * Root folders array
   */
  folders: Folder[]

  /**
   * Currently selected folder ID
   */
  selectedFolderId?: string | null

  /**
   * Show main navigation menu
   */
  showMainMenu?: boolean

  /**
   * Main menu items
   */
  mainMenuItems?: MenuItem[]

  /**
   * Show folders section
   */
  showFolders?: boolean

  /**
   * Allow search functionality
   */
  allowSearch?: boolean

}

const props = withDefaults(defineProps<Props>(), {
  selectedFolderId: null,
  showMainMenu: false,
  mainMenuItems: () => [],
  showFolders: true,
  allowSearch: true,
})

const emit = defineEmits<{
  'select-folder': [folder: Folder]
}>()

const dashboardStore = useDashboardStore()
const searchQuery = ref('')

/**
 * Get expandedFolders from store
 * This persists across component re-mounts
 * Unwrap Ref to pass actual Set object to FolderTree
 */
const expandedFolders = computed(() => unref(dashboardStore.expandedFolders))

/**
 * Filter folders by search query (simple implementation)
 */
const filteredFolders = computed(() => {
  if (!searchQuery.value.trim()) {
    return props.folders
  }

  const query = searchQuery.value.toLowerCase()
  const filter = (folders: Folder[]): Folder[] => {
    return folders
      .filter((folder) => folder.name.toLowerCase().includes(query))
      .map((folder) => ({
        ...folder,
        children: folder.children ? filter(folder.children) : undefined,
      }))
  }

  return filter(props.folders)
})

/**
 * Handle folder selection
 */
const handleFolderSelect = (folder: Folder) => {
  emit('select-folder', folder)
}

/**
 * Handle folder expand
 * Toggle expand state in store (persists across component re-mounts)
 */
const handleFolderExpand = (folderId: string) => {
  dashboardStore.toggleExpandFolder(folderId)
}
</script>

<style scoped>
.folder-sidebar {
  display: flex;
  flex-direction: column;
  /* Allow natural height growth based on content */
  min-height: auto;
  background-color: var(--color-bg-primary);
  border-right: 1px solid var(--color-border-light);
}

/* ========== SIDEBAR SECTION ========== */
.sidebar-section {
  border-bottom: 1px solid var(--color-border-light);
}

.sidebar-section:last-child {
  border-bottom: none;
  flex: 1;
  overflow: hidden;
}

/* ========== MAIN NAVIGATION ========== */
.main-nav {
  display: flex;
  flex-direction: column;
  padding: var(--spacing-sm) 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-lg);
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: all var(--transition-fast);
  cursor: pointer;
}

.nav-item:hover {
  background-color: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

.nav-item--active {
  background-color: var(--color-primary-lightest);
  color: var(--color-primary);
  font-weight: 600;
  border-left: 3px solid var(--color-primary);
}

.nav-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.nav-label {
  font-size: 0.9375rem;
}

/* ========== HEADER ========== */
.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 0.75rem;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.sidebar-title {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* ========== SEARCH ========== */
.sidebar-search {
  padding: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
  box-sizing: border-box;
}

.search-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  transition: all 0.2s ease;
  font-family: inherit;
  box-sizing: border-box;

  &::placeholder {
    color: #d1d5db;
  }

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
}

/* ========== CONTENT ========== */
.sidebar-content {
  /* In accordion context: flex: 1 won't work (parent has no height)
     So use min-height instead to let content grow naturally */
  flex: 0 1 auto;
  min-height: auto;
  overflow-y: auto;
  /* Remove overflow-x: hidden to allow badge to show */

  /* Custom scrollbar */
  scrollbar-width: thin;
  scrollbar-color: #d1d5db transparent;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 3px;

    &:hover {
      background: #9ca3af;
    }
  }
}

/* ========== FOOTER ========== */
.sidebar-footer {
  padding: 0.75rem;
  border-top: 1px solid #e5e7eb;
  background-color: #f9fafb;
  flex-shrink: 0;
}

/* ========== RESPONSIVE ========== */
@media (max-width: 768px) {
  .sidebar-header {
    padding: 0.75rem;
  }

  .sidebar-title {
    font-size: 0.8125rem;
  }
}
</style>
