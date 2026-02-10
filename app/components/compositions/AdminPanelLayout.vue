<template>
  <AdminLayout>
    <!-- Admin Two-Pane Layout (Sidebar + Main) -->
    <TwoPaneLayout
      :sidebar-width="260"
      sidebar-bg="#ffffff"
      main-bg="#f9fafb"
      class="admin-pane-layout"
    >
      <!-- Sidebar: Admin Navigation -->
      <template #sidebar>
        <nav class="admin-sidebar-nav">
          <slot name="sidebar" />
        </nav>
      </template>

      <!-- Main: Admin Content -->
      <div class="admin-main-content">
        <slot />
      </div>
    </TwoPaneLayout>
  </AdminLayout>
</template>

<script setup lang="ts">
/**
 * AdminPanelLayout - Admin panel page layout
 *
 * Combines:
 * - AdminLayout (dark header + footer)
 * - TwoPaneLayout (sidebar + main)
 *
 * Structure:
 * AdminLayout
 * ├─ Header (Dark #1f2937)
 * └─ TwoPaneLayout
 *    ├─ Sidebar (Admin navigation)
 *    └─ Main (Admin content)
 *
 * Features:
 * - Dark theme header
 * - Admin sidebar always visible
 * - Clean two-pane layout
 * - Scoped to admin section
 * - Desktop-only (Phase 1)
 *
 * Slots:
 * - sidebar: Admin navigation/menu
 * - default: Admin content area
 *
 * Usage:
 * <AdminPanelLayout>
 *   <template #sidebar>
 *     <AdminSidebar />
 *   </template>
 *   <AdminContent />
 * </AdminPanelLayout>
 */

import AdminLayout from '~/components/layouts/AdminLayout.vue'
import TwoPaneLayout from './TwoPaneLayout.vue'
</script>

<style scoped>
.admin-pane-layout {
  height: 100%;
  width: 100%;
}

.admin-sidebar-nav {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 0;
}

.admin-main-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 0;
}

/* ========== RESPONSIVE ========== */
/* No responsive for Phase 1 (desktop-only) */
</style>
