<template>
  <div class="app-layout">
    <!-- Header (Fixed) -->
    <header class="app-header">
      <AppHeader />
    </header>

    <!-- Main Container -->
    <div class="layout-container">
      <!-- Optional Sidebar -->
      <aside v-if="showSidebar" class="app-sidebar">
        <slot name="sidebar" />
      </aside>

      <!-- Main Content Area (Scrollable) -->
      <main class="main-content">
        <slot />
      </main>
    </div>

    <!-- Footer (Fixed) - TEMPORARILY HIDDEN FOR PREVIEW -->
    <footer v-if="false" class="app-footer">
      <AppFooter />
    </footer>
  </div>
</template>

<script setup lang="ts">
/**
 * AppLayout - Standard Page Layout Component
 * 
 * Enforces consistent structure across all pages:
 * - Fixed header at top
 * - Optional sidebar (left)
 * - Main scrollable content (right)
 * - Fixed footer at bottom
 * 
 * Usage:
 * <AppLayout :show-sidebar="true">
 *   <template #sidebar>
 *     <MyNavigation />
 *   </template>
 *   <MyPageContent />
 * </AppLayout>
 */

defineProps({
  /**
   * Show/hide sidebar
   * @default false
   */
  showSidebar: {
    type: Boolean,
    default: false,
  },
  
  /**
   * Sidebar width in rem units
   * @default 15 (250px)
   */
  sidebarWidth: {
    type: Number,
    default: 15,
  },
})

// Import header/footer components (will be created later)
import AppHeader from '~/components/ui/AppHeader.vue'
import AppFooter from '~/components/ui/AppFooter.vue'
</script>

<style scoped>
/**
 * Layout Structure:
 * 
 * app-layout (flex column, full height)
 * ├─ app-header (fixed, sticky)
 * ├─ layout-container (flex row, grows)
 * │  ├─ app-sidebar (optional, fixed width)
 * │  └─ main-content (flex, scrollable)
 * └─ app-footer (fixed, sticky)
 */

.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #ffffff;
}

/* ========== HEADER ========== */
.app-header {
  position: sticky;
  top: 0;
  z-index: 40;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

/* ========== MAIN CONTAINER ========== */
.layout-container {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* ========== SIDEBAR ========== */
.app-sidebar {
  width: v-bind('`${sidebarWidth}rem`');
  border-right: 1px solid #e5e7eb;
  overflow-y: auto;
  overflow-x: hidden;
  flex-shrink: 0;
  background-color: #f9fafb;
  
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
.main-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  
  /* Custom scrollbar */
  scrollbar-width: thin;
  scrollbar-color: #d1d5db #f3f4f6;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #ffffff;
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
.app-footer {
  position: sticky;
  bottom: 0;
  z-index: 30;
  border-top: 1px solid #e5e7eb;
  flex-shrink: 0;
  background-color: #f9fafb;
}

/* ========== RESPONSIVE DESIGN ========== */

/* Tablet: Reduce sidebar width */
@media (max-width: 1024px) {
  .app-sidebar {
    width: 12rem; /* 200px */
  }
}

/* Mobile: Hide sidebar by default, show in drawer */
@media (max-width: 768px) {
  .app-sidebar {
    position: absolute;
    left: -100%;
    width: 70vw;
    max-width: 280px;
    height: 100%;
    transition: left 0.3s ease;
    box-shadow: 2px 0 4px rgba(0, 0, 0, 0.1);
    z-index: 20;
  }
  
  /* When sidebar is visible on mobile */
  .app-layout.sidebar-open .app-sidebar {
    left: 0;
  }
  
  /* Dim background when sidebar open */
  .app-layout.sidebar-open::before {
    content: '';
    position: absolute;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 10;
  }
}

/* Print styles */
@media print {
  .app-header,
  .app-footer,
  .app-sidebar {
    display: none;
  }
  
  .main-content {
    overflow: visible;
  }
}
</style>
