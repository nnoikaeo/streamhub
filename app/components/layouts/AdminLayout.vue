<template>
  <div class="admin-layout">
    <!-- Header (Fixed) -->
    <header class="admin-header">
      <AdminHeader />
    </header>

    <!-- Main Container -->
    <div class="admin-container">
      <!-- Admin Sidebar (Always visible) -->
      <aside class="admin-sidebar">
        <slot name="sidebar" />
      </aside>

      <!-- Main Content Area (Scrollable) -->
      <main class="admin-main-content">
        <slot />
      </main>
    </div>

    <!-- Optional Footer -->
    <footer class="admin-footer">
      <slot name="footer" />
    </footer>
  </div>
</template>

<script setup lang="ts">
/**
 * AdminLayout - Admin Panel Layout Component
 * 
 * Specialized layout for admin panel with:
 * - Fixed header at top
 * - Always-visible sidebar (left)
 * - Main scrollable content (right)
 * - Optional footer
 * - Admin-specific styling and navigation
 * 
 * Desktop-only (no mobile responsive for Phase 1)
 * 
 * Usage:
 * <AdminLayout>
 *   <template #sidebar>
 *     <AdminSidebar />
 *   </template>
 *   <AdminPanel />
 * </AdminLayout>
 */

defineProps({
  /**
   * Admin sidebar width in rem units
   * @default 15 (250px)
   */
  sidebarWidth: {
    type: Number,
    default: 15,
  },
})

// Import header component (will be created later)
import AdminHeader from '~/components/ui/AdminHeader.vue'
</script>

<style scoped>
/**
 * Admin Layout Structure:
 * 
 * admin-layout (flex column, full height)
 * ├─ admin-header (fixed)
 * ├─ admin-container (flex row, grows)
 * │  ├─ admin-sidebar (fixed width, always visible)
 * │  └─ admin-main-content (flex, scrollable)
 * └─ admin-footer (optional)
 */

.admin-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f9fafb;
}

/* ========== HEADER ========== */
.admin-header {
  position: sticky;
  top: 0;
  z-index: 40;
  background-color: #1f2937;
  color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

/* ========== MAIN CONTAINER ========== */
.admin-container {
  display: flex;
  flex: 1;
  overflow: hidden;
  gap: 0;
}

/* ========== ADMIN SIDEBAR ========== */
.admin-sidebar {
  width: v-bind('`${sidebarWidth}rem`');
  border-right: 2px solid #e5e7eb;
  overflow-y: auto;
  overflow-x: hidden;
  flex-shrink: 0;
  background-color: #ffffff;
  box-shadow: 1px 0 2px rgba(0, 0, 0, 0.05);
  
  /* Custom scrollbar */
  scrollbar-width: thin;
  scrollbar-color: #d1d5db #f3f4f6;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f3f4f6;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 3px;
    
    &:hover {
      background: #9ca3af;
    }
  }
}

/* ========== MAIN CONTENT ========== */
.admin-main-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  background-color: #f9fafb;
  
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

/* ========== FOOTER ========== */
.admin-footer {
  position: sticky;
  bottom: 0;
  z-index: 30;
  border-top: 1px solid #e5e7eb;
  flex-shrink: 0;
  background-color: #ffffff;
  padding: 1rem;
}

/* ========== DESKTOP-ONLY (Phase 1) ========== */
/* No responsive design for Phase 1 */
</style>
