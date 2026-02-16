<script setup lang="ts">
/**
 * UnifiedSidebar Component
 * Unified sidebar for both dashboard and admin pages
 *
 * Features:
 * - Main navigation (Dashboard, Discover)
 * - Folder sidebar (with search, create, tree)
 * - Admin panel (collapsible accordion)
 * - Shared styling and interactions
 * - Single source of truth for navigation
 *
 * Props:
 * - folders: Folder array for folder section
 * - showFolders: Toggle folder section visibility
 * - showAdmin: Toggle admin section visibility
 * - allowSearch: Allow folder search
 * - allowCreate: Allow folder creation
 *
 * Events:
 * - select-folder: User selected a folder
 * - create-folder: User clicked create button
 *
 * Usage:
 * <!-- Dashboard Page -->
 * <UnifiedSidebar
 *   :folders="folders"
 *   show-folders
 *   :allow-search="true"
 *   :allow-create="false"
 * />
 *
 * <!-- Admin Page -->
 * <UnifiedSidebar
 *   :folders="folders"
 *   show-folders
 *   show-admin
 *   :allow-search="true"
 *   :allow-create="true"
 * />
 */

import { ref, computed } from 'vue'
import type { Folder } from '~/types/dashboard'
import AdminAccordion from '~/components/admin/AdminAccordion.vue'
import FolderSidebar from '~/components/features/FolderSidebar.vue'

interface MenuItem {
  path: string
  label: string
  icon: string
}

interface Props {
  /**
   * Folder array for folder section
   */
  folders?: Folder[]

  /**
   * Show folders section
   */
  showFolders?: boolean

  /**
   * Show admin accordion section
   */
  showAdmin?: boolean

  /**
   * Currently selected folder ID
   */
  selectedFolderId?: string | null

  /**
   * Allow folder search
   */
  allowSearch?: boolean

  /**
   * Allow create folder button
   */
  allowCreate?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  folders: () => [],
  showFolders: true,
  showAdmin: false,
  selectedFolderId: null,
  allowSearch: true,
  allowCreate: false,
})

const emit = defineEmits<{
  'select-folder': [folder: Folder]
  'create-folder': []
}>()

// Admin menu state
const isAdminOpen = ref(false)

// Main navigation items (always visible)
const mainNavItems = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: '🏠',
  },
  {
    path: '/discover',
    label: 'Discover',
    icon: '🔍',
  },
]

// Admin menu items (in accordion)
const adminMenuItems: MenuItem[] = [
  {
    path: '/admin',
    label: 'ภาพรวม',
    icon: '📊',
  },
  {
    path: '/admin/users',
    label: 'ผู้ใช้',
    icon: '👥',
  },
  {
    path: '/admin/dashboards',
    label: 'แดชบอร์ด',
    icon: '📈',
  },
  {
    path: '/admin/folders',
    label: 'โฟลเดอร์',
    icon: '📁',
  },
  {
    path: '/admin/companies',
    label: 'บริษัท',
    icon: '🏢',
  },
  {
    path: '/admin/groups',
    label: 'กลุ่ม',
    icon: '👫',
  },
  {
    path: '/admin/permissions',
    label: 'สิทธิ์',
    icon: '🔐',
  },
]

/**
 * Handle folder selection from FolderSidebar
 */
const handleSelectFolder = (folder: Folder) => {
  emit('select-folder', folder)
}

/**
 * Handle create folder button from FolderSidebar
 */
const handleCreateFolder = () => {
  emit('create-folder')
}
</script>

<template>
  <div class="unified-sidebar">
    <!-- Main Navigation Section (Always visible) -->
    <section class="sidebar-section">
      <nav class="main-nav">
        <NuxtLink
          v-for="item in mainNavItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          active-class="nav-item--active"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-label">{{ item.label }}</span>
        </NuxtLink>
      </nav>
    </section>

    <!-- Folder Section (Reused FolderSidebar) -->
    <FolderSidebar
      v-if="showFolders && folders.length > 0"
      :folders="folders"
      :selected-folder-id="selectedFolderId"
      :show-main-menu="false"
      :show-folders="true"
      :allow-search="allowSearch"
      :allow-create="allowCreate"
      @select-folder="handleSelectFolder"
      @create-folder="handleCreateFolder"
    />

    <!-- Admin Accordion Section (Collapsible) -->
    <AdminAccordion
      v-if="showAdmin"
      v-model="isAdminOpen"
      title="Admin Panel"
      :items="adminMenuItems"
    />

    <!-- Footer Slot (Optional) -->
    <slot name="footer" />
  </div>
</template>

<style scoped>
/* ========== UNIFIED SIDEBAR WRAPPER ========== */
.unified-sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--color-bg-primary, #ffffff);
  overflow: hidden;
}

/* ========== SIDEBAR SECTION ========== */
.sidebar-section {
  border-bottom: 1px solid var(--color-border-light, #e5e7eb);
  flex-shrink: 0;
}

/* ========== MAIN NAVIGATION ========== */
.main-nav {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: var(--spacing-sm, 0.5rem) 0;
}

/* ========== NAV ITEM ========== */
.nav-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm, 0.5rem);
  padding: var(--spacing-sm, 0.5rem) var(--spacing-lg, 1.25rem);
  color: var(--color-text-secondary, #6b7280);
  text-decoration: none;
  transition: all var(--transition-base, 0.2s ease);
  font-size: 0.9375rem;
}

.nav-item:hover {
  background-color: var(--color-bg-secondary, #f3f4f6);
  color: var(--color-text-primary, #1f2937);
}

.nav-item--active {
  background-color: rgba(59, 130, 246, 0.08);
  color: var(--color-primary, #3b82f6);
  font-weight: 600;
  border-left: 3px solid var(--color-primary, #3b82f6);
  padding-left: calc(var(--spacing-lg, 1.25rem) - 0.25rem);
}

.nav-item:focus {
  outline: 2px solid transparent;
  outline-offset: -2px;
}

.nav-item:focus-visible {
  outline: 2px solid var(--color-primary, #3b82f6);
}

/* ========== NAV ICON ========== */
.nav-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  font-size: 1.2rem;
  flex-shrink: 0;
}

/* ========== NAV LABEL ========== */
.nav-label {
  flex: 1;
}

/* ========== CUSTOM SCROLLBAR ========== */
.unified-sidebar {
  scrollbar-width: thin;
  scrollbar-color: #d1d5db transparent;
}

.unified-sidebar::-webkit-scrollbar {
  width: 6px;
}

.unified-sidebar::-webkit-scrollbar-track {
  background: transparent;
}

.unified-sidebar::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

.unified-sidebar::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

/* ========== RESPONSIVE ========== */
@media (max-width: 640px) {
  .nav-item {
    padding: var(--spacing-xs, 0.25rem) var(--spacing-md, 1rem);
    font-size: 0.875rem;
  }

  .nav-label {
    font-size: 0.875rem;
  }

  .nav-item--active {
    padding-left: calc(var(--spacing-md, 1rem) - 0.25rem);
  }
}
</style>
