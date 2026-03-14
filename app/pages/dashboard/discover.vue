<template>
  <ClientOnly>
    <PageLayout
      v-if="!isLoading && folders.length > 0"
      :breadcrumbs="breadcrumbItems"
      :folders="folderTree"
      :selected-folder-id="selectedFolderId"
      show-folders
      :allow-search="true"
      :allow-create="canCreateFolder"
      @select-folder="(folder) => selectFolder(folder.id)"
      @create-folder="handleCreateFolder"
    >
      <!-- Main: Dashboard Grid -->
      <div class="discover-main-content">

          <!-- Filters: Tag + Folder -->
          <div class="discover-filters">
            <TagFilter
              v-if="tagStore.activeTags.length > 0"
              :tags="tagStore.activeTags"
              :selected-tag-ids="tagStore.selectedTagIds"
              @update:selected-tag-ids="handleTagFilterUpdate"
            />
            <FolderDropdownFilter
              v-if="flattenedFolders.length > 0"
              v-model="dropdownFolderId"
              :folders="flattenedFolders"
              :dashboard-counts="dashboardCountByFolder"
              @update:model-value="handleDropdownChange"
            />
          </div>

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
            <h2 class="dashboards-count">{{ dashboardCountText }}</h2>
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

          <!-- Grouped View (when showing all folders) -->
          <GroupedDashboardGrid
            v-if="isGroupedView"
            :groups="groupedDashboards"
            :loading="isLoading"
            empty-message="ไม่พบแดชบอร์ด"
            @view-dashboard="handleViewDashboard"
            @share-dashboard="handleShareDashboard"
            @menu-dashboard="handleMenuDashboard"
          />

          <!-- Flat View (when specific folder selected) -->
          <DashboardGrid
            v-else
            :dashboards="filteredDashboards"
            :loading="isLoading"
            empty-message="ไม่มีแดชบอร์ดในโฟลเดอร์นี้"
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
    </PageLayout>
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
import PageLayout from '~/components/compositions/PageLayout.vue'
import DashboardGrid from '~/components/features/DashboardGrid.vue'
import GroupedDashboardGrid from '~/components/features/GroupedDashboardGrid.vue'
import FolderDropdownFilter from '~/components/features/FolderDropdownFilter.vue'
import QuickShareDialog from '~/components/features/QuickShareDialog.vue'
import TagFilter from '~/components/features/TagFilter.vue'
import { computed, ref, watch, onMounted } from 'vue'
import { useTagStore } from '~/stores/tags'
import { useAdminTags } from '~/composables/useAdminTags'

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

/**
 * Build folder tree hierarchy with children from flat folders array
 * Converts flat folders to tree structure for FolderTree component
 */
const buildFolderTree = (flatFolders: Folder[]): Folder[] => {
  const folderMap = new Map<string, Folder & { children: Folder[] }>()

  // First pass: create enhanced folder objects with empty children arrays
  for (const folder of flatFolders) {
    folderMap.set(folder.id, {
      ...folder,
      children: []
    })
  }

  // Second pass: build parent-child relationships
  const rootFolders: (Folder & { children: Folder[] })[] = []
  for (const folder of flatFolders) {
    const enhancedFolder = folderMap.get(folder.id)!
    if (folder.parentId) {
      // This folder has a parent
      const parentFolder = folderMap.get(folder.parentId)
      if (parentFolder) {
        parentFolder.children.push(enhancedFolder)
      }
    } else {
      // Root folder (no parent)
      rootFolders.push(enhancedFolder)
    }
  }

  return rootFolders
}

/**
 * Folder tree with hierarchy built from flat folders array
 */
const folderTree = computed(() => buildFolderTree(folders.value))

// ========== Tag Store & Filter ==========
const tagStore = useTagStore()
const { fetchTags } = useAdminTags()

onMounted(async () => {
  try {
    await fetchTags()
  } catch (e) {
    console.warn('[discover] Failed to load tags:', e)
  }
})

const handleTagFilterUpdate = (ids: string[]) => {
  tagStore.clearTagFilter()
  ids.forEach((id) => tagStore.toggleTagFilter(id))
}

/**
 * Filtered dashboards by selected tags (AND logic)
 * If no tags selected → show all dashboards
 */
const filteredDashboards = computed<Dashboard[]>(() => {
  const selected = tagStore.selectedTagIds
  if (selected.length === 0) return dashboards.value
  return dashboards.value.filter((d) => {
    const dTags = d.tags ?? []
    return selected.every((tagId) => dTags.includes(tagId))
  })
})

// ========== Folder Dropdown Filter ==========
const router = useRouter()

/**
 * Flatten folder tree in display order (for dropdown hierarchy)
 */
const flattenedFolders = computed(() => {
  const result: (Folder & { level: number })[] = []
  const walk = (nodes: (Folder & { children?: Folder[] })[], level: number) => {
    for (const node of nodes) {
      result.push({ ...node, level })
      if (node.children?.length) walk(node.children, level + 1)
    }
  }
  walk(folderTree.value, 0)
  return result
})

/**
 * Dashboard count per folder (respects tag filter)
 */
const dashboardCountByFolder = computed(() => {
  const counts: Record<string, number> = {}
  for (const d of filteredDashboards.value) {
    counts[d.folderId] = (counts[d.folderId] || 0) + 1
  }
  return counts
})

/**
 * Folder dropdown state — synced with sidebar selectedFolderId
 */
const dropdownFolderId = ref<string | null>(selectedFolderId.value || null)

watch(selectedFolderId, (id) => {
  dropdownFolderId.value = id
})

const handleDropdownChange = (folderId: string | null) => {
  if (folderId) {
    selectFolder(folderId)
  } else {
    router.push('/dashboard/discover')
  }
}

/**
 * Grouped view — active when no folder is selected
 */
const isGroupedView = computed(() => !selectedFolderId.value)

/**
 * Group filtered dashboards by folder (hide empty groups)
 */
const groupedDashboards = computed(() => {
  if (!isGroupedView.value) return []
  const folderMap = new Map<string, { folder: Folder; dashboards: Dashboard[] }>()
  for (const folder of folders.value) {
    folderMap.set(folder.id, { folder, dashboards: [] })
  }
  for (const d of filteredDashboards.value) {
    const group = folderMap.get(d.folderId)
    if (group) group.dashboards.push(d)
  }
  return Array.from(folderMap.values())
    .filter((g) => g.dashboards.length > 0)
    .sort((a, b) => a.folder.name.localeCompare(b.folder.name, 'th'))
})

/**
 * Status text showing count + active tag names
 */
const dashboardCountText = computed(() => {
  const count = filteredDashboards.value.length
  const selected = tagStore.selectedTagIds
  if (isGroupedView.value) {
    const groupCount = groupedDashboards.value.length
    const base = `พบ ${count} แดชบอร์ด ใน ${groupCount} โฟลเดอร์`
    if (selected.length > 0) {
      const tagNames = tagStore.getTagsByIds(selected).map((t) => t.name).join(', ')
      return `${base} · แท็ก: ${tagNames}`
    }
    return base
  }
  if (selected.length === 0) return `พบ ${count} แดชบอร์ด`
  const tagNames = tagStore.getTagsByIds(selected).map((t) => t.name).join(', ')
  return `แสดง ${count} แดชบอร์ด · แท็ก: ${tagNames}`
})

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

/* ========== FILTERS ========== */
.discover-filters {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex-wrap: wrap;
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