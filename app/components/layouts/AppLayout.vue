<template>
  <div class="app-layout" :class="{ 'sidebar-open': isSidebarOpen }">
    <!-- Offline notice — the Firestore SDK queues writes silently and never
         times out, so without this a save just hangs with no explanation -->
    <div v-if="!isOnline" class="offline-banner" role="status">
      ⚠️ ออฟไลน์ — การบันทึกจะค้างจนกว่าจะกลับมาออนไลน์ (ข้อมูลไม่หาย ระบบจะส่งให้เองเมื่อเชื่อมต่อได้)
    </div>

    <!-- Header (Fixed) -->
    <header class="app-header">
      <AppHeader
        :show-menu-button="showSidebar"
        @toggle-sidebar="isSidebarOpen = !isSidebarOpen"
      />
    </header>

    <!-- Main Container -->
    <div class="layout-container">
      <!-- Optional Sidebar -->
      <aside v-if="showSidebar" class="app-sidebar" @click="closeOnLinkTap">
        <slot name="sidebar" />
      </aside>

      <!-- Dim + tap-to-close, mobile only (the CSS keeps it out of the way
           above 768px, where the sidebar is always in the flow) -->
      <div
        v-if="showSidebar && isSidebarOpen"
        class="sidebar-overlay"
        @click="isSidebarOpen = false"
      />

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

// Import header/footer components (will be created later)
import { ref, watch } from 'vue'
import AppHeader from '~/components/ui/AppHeader.vue'
import AppFooter from '~/components/ui/AppFooter.vue'

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

/**
 * Drawer state, mobile only — above 768px the sidebar sits in the flow and
 * this stays irrelevant. Tapping a link inside the drawer navigates, so the
 * drawer has to close or it covers the page it just opened.
 */
const isSidebarOpen = ref(false)
const route = useRoute()
const { isOnline } = useOnlineStatus()

/**
 * Close on the tap itself rather than on the navigation it triggers: tapping
 * the entry for the page you are already on — "แดชบอร์ดทั้งหมด" while on
 * /dashboard/discover — resolves to the same route, so no navigation happens
 * and a route watcher alone left the drawer stuck open. Only links count;
 * tapping an accordion header expands a section and must not close the drawer.
 */
const closeOnLinkTap = (event: MouseEvent) => {
  const target = event.target as HTMLElement | null
  if (target?.closest('a')) isSidebarOpen.value = false
}

// Still needed for navigation the drawer did not start (breadcrumbs, redirects)
watch(() => route.fullPath, () => {
  isSidebarOpen.value = false
})
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

/* ========== OFFLINE BANNER ========== */
.offline-banner {
  padding: 0.5rem 1rem;
  background-color: #fef3c7;
  color: #92400e;
  font-size: 0.875rem;
  text-align: center;
  border-bottom: 1px solid #fde68a;
  flex-shrink: 0;
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
  
  /* Dim background behind the open drawer */
  .sidebar-overlay {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 10;
  }
}

/* The overlay only exists as a mobile affordance — never let it cover a
   desktop layout, where the sidebar is always visible anyway. */
@media (min-width: 769px) {
  .sidebar-overlay {
    display: none;
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
