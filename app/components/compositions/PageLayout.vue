<script setup lang="ts">
/**
 * PageLayout - Unified page layout composition
 *
 * Used by both dashboard and admin pages to provide consistent:
 * - Header (AppLayout)
 * - Sidebar (UnifiedSidebar with Main nav + optional Folders accordion + optional Admin accordion)
 * - Optional Breadcrumbs
 * - Main content area
 *
 * Props:
 * - breadcrumbs: Optional array of breadcrumb items to display
 * - folders: Array of Folder objects for sidebar
 * - showFolders: Show/hide folders accordion section
 * - showAdmin: Show/hide admin accordion section
 * - allowSearch: Allow searching within folders
 * - allowCreate: Allow creating new folders
 * - selectedFolderId: Currently selected folder ID
 * - sidebarWidth: Sidebar width in rem units
 *
 * Events:
 * - select-folder: Fired when a folder is selected
 * - create-folder: Fired when create folder is clicked
 *
 * Usage:
 * <PageLayout
 *   :breadcrumbs="breadcrumbs"
 *   :folders="folders"
 *   show-folders
 *   show-admin
 *   @select-folder="handleSelectFolder"
 * >
 *   <!-- Page content goes here -->
 * </PageLayout>
 */

import type { Folder } from '~/types/dashboard'
import AppLayout from '~/components/layouts/AppLayout.vue'
import UnifiedSidebar from '~/components/layouts/UnifiedSidebar.vue'
import Breadcrumbs from '~/components/ui/Breadcrumbs.vue'
import { useSidebarVisibility } from '~/composables/useSidebarVisibility'

interface BreadcrumbItem {
  label: string
  to?: string
  icon?: string
}

interface Props {
  /**
   * Array of breadcrumb items to display above main content
   * If empty or undefined, breadcrumb bar is not rendered
   */
  breadcrumbs?: BreadcrumbItem[]

  /**
   * Folder array for the sidebar folder section
   */
  folders?: Folder[]

  /**
   * Allow folder search in sidebar
   */
  allowSearch?: boolean

  /**
   * Allow create folder button in sidebar
   */
  allowCreate?: boolean

  /**
   * Currently selected folder ID
   */
  selectedFolderId?: string | null

  /**
   * Sidebar width in rem units
   */
  sidebarWidth?: number
}

const props = withDefaults(defineProps<Props>(), {
  breadcrumbs: undefined,
  folders: () => [],
  allowSearch: true,
  allowCreate: false,
  selectedFolderId: null,
  sidebarWidth: 15,
})

/**
 * Get sidebar visibility from composable (role-based)
 * No longer determined by page - determined by user role
 */
const { showAdmin, showFolders } = useSidebarVisibility()

const emit = defineEmits<{
  'select-folder': [folder: Folder]
  'create-folder': []
}>()

/**
 * Forward folder-related events from UnifiedSidebar
 */
const handleSelectFolder = (folder: Folder) => {
  emit('select-folder', folder)
}

const handleCreateFolder = () => {
  emit('create-folder')
}
</script>

<template>
  <AppLayout :show-sidebar="true" :sidebar-width="sidebarWidth">
    <!-- Sidebar: UnifiedSidebar with configurable sections -->
    <template #sidebar>
      <UnifiedSidebar
        :folders="folders"
        :show-folders="showFolders"
        :show-admin="showAdmin"
        :allow-search="allowSearch"
        :allow-create="allowCreate"
        :selected-folder-id="selectedFolderId"
        @select-folder="handleSelectFolder"
        @create-folder="handleCreateFolder"
      />
      <!-- Note: showFolders & showAdmin now determined by user role via composable -->
    </template>

    <!-- Main content area -->
    <div class="page-layout-main">
      <!-- Optional breadcrumbs bar -->
      <div
        v-if="breadcrumbs && breadcrumbs.length"
        class="page-layout-breadcrumbs"
      >
        <Breadcrumbs :items="breadcrumbs" />
      </div>

      <!-- Page content slot -->
      <slot />
    </div>
  </AppLayout>
</template>

<style scoped>
.page-layout-main {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.page-layout-breadcrumbs {
  padding: 0 var(--spacing-xl);
  flex-shrink: 0;
  border-bottom: 1px solid var(--color-border-light, #e5e7eb);
  background-color: var(--color-bg-primary, #ffffff);
}
</style>
