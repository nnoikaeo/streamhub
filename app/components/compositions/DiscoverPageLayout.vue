<template>
  <AppLayout :show-sidebar="false">
    <!-- Main Content Area with Header + Grid -->
    <div class="discover-page-layout">
      <!-- Breadcrumb Navigation -->
      <div class="discover-header">
        <Breadcrumb
          :items="breadcrumbItems"
          @navigate="$emit('navigate-breadcrumb', $event)"
        />
      </div>

      <!-- Two-Pane Container (Sidebar + Dashboard Grid) -->
      <TwoPaneLayout :sidebar-width="280" class="discover-panes">
        <!-- Sidebar: Folder Navigation -->
        <template #sidebar>
          <slot name="sidebar" />
        </template>

        <!-- Main: Dashboard Grid -->
        <div class="discover-main">
          <slot />
        </div>
      </TwoPaneLayout>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
/**
 * DiscoverPageLayout - Dashboard discovery/browse page layout
 *
 * Combines:
 * - AppLayout (header + footer)
 * - Breadcrumb navigation
 * - TwoPaneLayout (sidebar folders + main dashboards)
 *
 * Structure:
 * AppLayout
 * ├─ Breadcrumb (navigation path)
 * └─ TwoPaneLayout
 *    ├─ Sidebar (Folder tree)
 *    └─ Main (Dashboard grid)
 *
 * Features:
 * - Folder tree in sidebar (files/folders only)
 * - Dashboard grid in main area
 * - Breadcrumb shows current path
 * - Responsive (sidebar hidden on mobile)
 *
 * Slots:
 * - sidebar: Folder navigation component
 * - default: Dashboard grid content
 *
 * Events:
 * - navigate-breadcrumb: Fired when breadcrumb clicked
 *
 * Usage:
 * <DiscoverPageLayout :breadcrumb-items="items">
 *   <template #sidebar>
 *     <FolderTree :folders="folders" />
 *   </template>
 *   <DashboardGrid :dashboards="dashboards" />
 * </DiscoverPageLayout>
 */

interface BreadcrumbItem {
  label: string
  to?: string | null
}

defineProps({
  /**
   * Breadcrumb items for current path
   */
  breadcrumbItems: {
    type: Array as () => BreadcrumbItem[],
    required: true,
  },
})

defineEmits<{
  'navigate-breadcrumb': [to: string]
}>()

import AppLayout from '~/components/layouts/AppLayout.vue'
import Breadcrumb from '~/components/ui/Breadcrumb.vue'
import TwoPaneLayout from './TwoPaneLayout.vue'
</script>

<style scoped>
.discover-page-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  gap: 0;
}

/* ========== HEADER (Breadcrumb) ========== */
.discover-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  background-color: #ffffff;
  flex-shrink: 0;
}

/* ========== TWO-PANE CONTAINER ========== */
.discover-panes {
  flex: 1;
  overflow: hidden;
}

.discover-main {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 1.5rem;
  overflow-y: auto;

  /* Custom scrollbar */
  scrollbar-width: thin;
  scrollbar-color: #d1d5db #f3f4f6;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f9fafb;
  }

  &::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 3px;

    &:hover {
      background: #9ca3af;
    }
  }
}

/* ========== RESPONSIVE ========== */
@media (max-width: 768px) {
  .discover-header {
    padding: 0.75rem 1rem;
  }

  .discover-main {
    padding: 1rem;
  }
}
</style>
