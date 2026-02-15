<template>
  <ClientOnly>
    <div v-if="!isLoading && folders.length > 0" class="discover-page-wrapper">
      <DiscoverPageLayout>
        <!-- Sidebar: Folder Tree Navigation -->
        <template #sidebar>
          <FolderSidebar
            :folders="folders"
            :selected-folder-id="selectedFolderId"
            :show-main-menu="true"
            :main-menu-items="[
              { label: 'หน้าแรก', icon: '🏠', to: '/dashboard' },
              { label: 'รายการแดชบอร์ด', icon: '📊', to: '/dashboard/discover' }
            ]"
            :show-folders="true"
            :allow-search="true"
            :allow-create="canCreateFolder"
            @select-folder="(folder: Folder) => selectFolder(folder.id)"
            @create-folder="handleCreateFolder"
          />
        </template>

        <!-- Main: Dashboard Grid -->
        <div class="discover-main-content">
          <!-- Breadcrumbs Navigation -->
          <Breadcrumbs :items="breadcrumbItems" />

          <!-- Dashboards Found Header -->
          <div class="dashboards-header">
            <svg class="header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
            <h2 class="dashboards-count">{{ dashboards.length }} Dashboards Found</h2>
          </div>

          <!-- Error Message -->
          <div v-if="error" class="theme-alert theme-alert--error" role="alert">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{{ error }}</span>
            <button type="button" class="theme-alert__close" @click="error = null" aria-label="Dismiss error">
              ✕
            </button>
          </div>

          <!-- Dashboard Grid with Loading State -->
          <DashboardGrid
            :dashboards="dashboards"
            :loading="isLoading"
            empty-message="No dashboards in this folder. Create one to get started!"
            @view-dashboard="handleViewDashboard"
            @share-dashboard="handleShareDashboard"
            @menu-dashboard="handleMenuDashboard"
          />

          <!-- Infinite scroll sentinel (triggers load when visible) -->
          <div ref="infiniteScrollSentinel" class="infinite-scroll-sentinel" />

          <!-- Quick Share Dialog -->
          <ClientOnly>
            <QuickShareDialog
              v-if="shareDialogOpen && selectedDashboard"
              v-model="shareDialogOpen"
              :dashboard-id="selectedDashboard.id"
              :available-users="availableUsers"
              @share="handleShare"
            />
          </ClientOnly>
        </div>
      </DiscoverPageLayout>
    </div>
    <div v-else class="loading-wrapper">
      <div class="loading-message">
        <div class="spinner" />
        <p>Loading dashboard discovery...</p>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
/**
 * Dashboard Discover Page - Strategy 4 Implementation
 *
 * Strategy 4: Hybrid Approach using:
 * - Layout Composition (DiscoverPageLayout)
 * - Pinia Stores (dashboard, permissions)
 * - Composable Logic (useDashboardPage)
 * - Generic Components (DashboardGrid, FolderSidebar)
 *
 * Benefits:
 * - Page logic extracted to composables (reusable)
 * - State managed in Pinia stores (shared across app)
 * - Permissions integrated in composable (permission checks at data level)
 * - Cleaner component code (focus on template/presentation)
 * - Easy to test (can mock composable)
 * - Easy to extend (add new features in composable)
 *
 * Before (old approach): ~300 lines of inline logic
 * After (Strategy 4): ~50 lines of pure presentation
 */

import type { Folder, Dashboard } from '~/types/dashboard'
import { useDashboardPage } from '~/composables/useDashboardPage'
import DiscoverPageLayout from '~/components/compositions/DiscoverPageLayout.vue'
import FolderSidebar from '~/components/features/FolderSidebar.vue'
import DashboardGrid from '~/components/features/DashboardGrid.vue'
import QuickShareDialog from '~/components/features/QuickShareDialog.vue'

const route = useRoute()
console.log('📄 [dashboard-discover.vue] Page mounted - Route:', { path: route.path, name: route.name })

// Page metadata
definePageMeta({
  middleware: 'auth',
  layout: 'default',
  ssr: false,
})

// ========== Strategy 4: Extract all logic to composable ==========
// This is the key difference from the old approach:
// Instead of inline state management and methods, we use the composable
// which encapsulates all dashboard page logic
const {
  // Data from store
  dashboards,
  folders,
  selectedFolderId,
  selectedDashboard,
  folderPath,
  breadcrumbItems,
  isLoading,
  error,
  shareDialogOpen,
  availableUsers,
  infiniteScrollSentinel,

  // Permissions from store
  canCreateFolder,
  canShareDashboard,

  // Methods
  selectFolder,
  handleViewDashboard,
  handleShareDashboard,
  handleMenuDashboard,
  handleShare,
  handleCreateFolder,
} = useDashboardPage({
  enableInfiniteScroll: true,
})

// ========== Key Differences from Old Approach ==========

// OLD: ~120 lines of state declarations
// NEW: Everything comes from useDashboardPage composable

// OLD: ~60 lines of methods for folder/dashboard loading
// NEW: loadFolders and loadDashboards are in composable

// OLD: ~50 lines of watcher logic
// NEW: Route watcher is in composable

// OLD: ~70 lines of lifecycle and infinite scroll setup
// NEW: setupInfiniteScroll is called in composable's onMounted

// ========== Permission-Based UI ==========

// Permission checks are now automatic in composable:
// - If canCreateFolder = false, create button will be disabled (prop binding)
// - If canShareDashboard = false, share dialog won't open
// - If canViewDashboards = false, view action is blocked at composable level

// ========== Benefits of Strategy 4 ==========

// 1. Reusability: useDashboardPage can be used in AdminPage, or other pages
//    that need similar dashboard logic
//
// 2. State Sharing: Pinia stores (dashboard, permissions) are shared across app
//    If another page changes a dashboard, all pages get updated automatically
//
// 3. Permissions: All permission checks are centralized in usePermissionsStore
//    No need for inline v-if checks in template
//
// 4. Testing: Easy to unit test the composable
//    Mock dashboardService and test all edge cases
//
// 5. Performance: Computed properties in stores are cached
//    No unnecessary re-renders
//
// 6. Maintenance: Adding new feature only requires changes in:
//    - useDashboardPage composable
//    - Template (to use new data/methods)
//    - No need to modify multiple files
</script>

<style scoped>
.discover-page-wrapper {
  width: 100%;
  height: 100%;
}

.loading-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-primary-dark) 100%);
}

.loading-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
  color: var(--color-text-inverse);
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.discover-main-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  padding: 0 var(--spacing-xl);
}

/* ========== DASHBOARDS HEADER ========== */
.dashboards-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
}

.header-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

.dashboards-count {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

/* ========== INFINITE SCROLL SENTINEL ========== */
.infinite-scroll-sentinel {
  height: 1px;
  visibility: hidden;
}

/* Responsive */
@media (max-width: 768px) {
  .discover-main-content {
    padding: 0 var(--spacing-md);
  }

  .dashboards-count {
    font-size: 1.125rem;
  }
}
</style>