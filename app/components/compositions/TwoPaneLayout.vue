<template>
  <div class="two-pane-layout">
    <!-- Sidebar Pane -->
    <aside class="two-pane-sidebar">
      <div class="sidebar-content">
        <slot name="sidebar" />
      </div>
    </aside>

    <!-- Main Pane -->
    <main class="two-pane-main">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
/**
 * TwoPaneLayout - Reusable two-pane composition component
 *
 * Generic sidebar + main content layout pattern used by:
 * - Discover page (sidebar: folders, main: dashboards grid)
 * - View page (sidebar: navigation, main: dashboard content)
 * - Admin panels (sidebar: admin nav, main: content)
 *
 * Features:
 * - Fixed sidebar with scrollable content
 * - Flexible main area with scrollable content
 * - Customizable sidebar width
 * - Responsive design (sidebar hidden on mobile)
 *
 * Slots:
 * - sidebar: Left sidebar content
 * - default: Main content area
 *
 * Usage:
 * <TwoPaneLayout :sidebar-width="250">
 *   <template #sidebar>
 *     <Navigation />
 *   </template>
 *   <MainContent />
 * </TwoPaneLayout>
 */

defineProps({
  /**
   * Sidebar width in pixels
   * @default 280
   */
  sidebarWidth: {
    type: Number,
    default: 280,
  },

  /**
   * Show/hide sidebar (useful for mobile)
   * @default true
   */
  showSidebar: {
    type: Boolean,
    default: true,
  },

  /**
   * Sidebar background color (Tailwind class)
   * @default 'bg-gray-50'
   */
  sidebarBg: {
    type: String,
    default: '#f9fafb',
  },

  /**
   * Main content background color (Tailwind class)
   * @default 'bg-white'
   */
  mainBg: {
    type: String,
    default: '#ffffff',
  },
})
</script>

<style scoped>
.two-pane-layout {
  display: flex;
  height: 100%;
  width: 100%;
  overflow: hidden;
  background-color: #ffffff;
}

/* ========== SIDEBAR PANE ========== */
.two-pane-sidebar {
  flex-shrink: 0;
  width: v-bind('`${sidebarWidth}px`');
  border-right: 1px solid #e5e7eb;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background-color: v-bind('sidebarBg');
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;

  /* Custom scrollbar */
  scrollbar-width: thin;
  scrollbar-color: #d1d5db #f3f4f6;

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

/* ========== MAIN PANE ========== */
.two-pane-main {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  background-color: v-bind('mainBg');

  /* Custom scrollbar */
  scrollbar-width: thin;
  scrollbar-color: #d1d5db #f3f4f6;

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

/* ========== RESPONSIVE ========== */

/* Tablet: Reduce sidebar width */
@media (max-width: 1024px) {
  .two-pane-sidebar {
    width: 220px;
  }
}

/* Mobile: Hide sidebar */
@media (max-width: 768px) {
  .two-pane-sidebar {
    display: none;
  }

  .two-pane-layout {
    flex-direction: column;
  }
}
</style>
