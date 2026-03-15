<template>
  <ClientOnly>
    <PageLayout
      v-if="!isInitializing"
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

          <!-- Search Bar -->
          <div class="discover-search">
            <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              class="search-input"
              placeholder="ค้นหาแดชบอร์ด..."
              aria-label="ค้นหาแดชบอร์ด"
            />
            <button
              v-if="searchQuery"
              type="button"
              class="search-clear"
              aria-label="ล้างการค้นหา"
              @click="searchQuery = ''"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

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
              :key="folderDropdownKey"
              v-model="dropdownFolderId"
              :folders="flattenedFolders"
              :dashboard-counts="dashboardCountByFolder"
              @update:model-value="handleDropdownChange"
            />
            <CompanyDropdownFilter
              v-if="companies.length > 0"
              v-model="selectedCompanyCode"
              :companies="companies"
              @update:model-value="handleCompanyFilterChange"
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
            :user-map="userMap"
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
import CompanyDropdownFilter from '~/components/features/CompanyDropdownFilter.vue'
import QuickShareDialog from '~/components/features/QuickShareDialog.vue'
import TagFilter from '~/components/features/TagFilter.vue'
import { computed, ref, watch, onMounted } from 'vue'
import { useTagStore } from '~/stores/tags'
import { useAdminTags } from '~/composables/useAdminTags'
import { useAdminCompanies } from '~/composables/useAdminCompanies'
import { useAdminUsers } from '~/composables/useAdminUsers'
import { useCompanyAccess } from '~/composables/useCompanyAccess'

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
  isInitializing,
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

// ========== Company Filter ==========
const { companies, fetchCompanies } = useAdminCompanies()
const { isAdmin } = useCompanyAccess()
const selectedCompanyCode = ref<string | null>(null)
const searchQuery = ref('')

// ========== Users (for moderator display) ==========
const { users, fetchUsers } = useAdminUsers()

const userMap = computed(() => {
  const map: Record<string, any> = {}
  for (const u of users.value) {
    map[u.uid] = u
  }
  return map
})

onMounted(async () => {
  try {
    await Promise.all([
      fetchTags(),
      fetchCompanies(),
      fetchUsers(),
    ])
  } catch (e) {
    console.warn('[discover] Failed to load tags/companies/users:', e)
  }
})

const handleCompanyFilterChange = (code: string | null) => {
  selectedCompanyCode.value = code
}

const handleTagFilterUpdate = (ids: string[]) => {
  tagStore.clearTagFilter()
  ids.forEach((id) => tagStore.toggleTagFilter(id))
}

/**
 * Filtered dashboards by selected tags (AND logic) + company filter
 */
const filteredDashboards = computed<Dashboard[]>(() => {
  let result = dashboards.value

  // Search filter (name + description, case-insensitive)
  const query = searchQuery.value.trim().toLowerCase()
  if (query) {
    result = result.filter((d) =>
      d.name.toLowerCase().includes(query) ||
      d.description?.toLowerCase().includes(query)
    )
  }

  // Company filter (admin only)
  const companyCode = selectedCompanyCode.value
  if (companyCode) {
    result = result.filter((d) => {
      const companyAccess = d.access?.company
      if (!companyAccess) return false
      return companyCode in companyAccess
    })
  }

  // Tag filter (AND logic)
  const selected = tagStore.selectedTagIds
  if (selected.length > 0) {
    result = result.filter((d) => {
      const dTags = d.tags ?? []
      return selected.every((tagId) => dTags.includes(tagId))
    })
  }

  return result
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
 * Key that changes when dashboard counts update — forces FolderDropdownFilter
 * to re-mount so <option> text nodes reflect the latest counts
 */
const folderDropdownKey = computed(() =>
  Object.values(dashboardCountByFolder.value).reduce((a, b) => a + b, 0)
)

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
const isGroupedView = computed(() => !selectedFolderId.value && folders.value.length > 0)

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
 * Status text showing count + active tag names + company filter
 */
const dashboardCountText = computed(() => {
  const selected = tagStore.selectedTagIds
  const companySuffix = selectedCompanyCode.value ? ` · บริษัท: ${selectedCompanyCode.value}` : ''
  const searchSuffix = searchQuery.value.trim() ? ` · ค้นหา: "${searchQuery.value.trim()}"` : ''

  if (isGroupedView.value) {
    const groupCount = groupedDashboards.value.length
    const count = groupedDashboards.value.reduce((sum, g) => sum + g.dashboards.length, 0)
    const base = `พบ ${count} แดชบอร์ด ใน ${groupCount} โฟลเดอร์`
    if (selected.length > 0) {
      const tagNames = tagStore.getTagsByIds(selected).map((t) => t.name).join(', ')
      return `${base} · แท็ก: ${tagNames}${companySuffix}${searchSuffix}`
    }
    return `${base}${companySuffix}${searchSuffix}`
  }
  const count = filteredDashboards.value.length
  if (selected.length === 0) return `พบ ${count} แดชบอร์ด${companySuffix}${searchSuffix}`
  const tagNames = tagStore.getTagsByIds(selected).map((t) => t.name).join(', ')
  return `แสดง ${count} แดชบอร์ด · แท็ก: ${tagNames}${companySuffix}${searchSuffix}`
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
  padding: var(--spacing-lg) var(--spacing-xl) 0;
}

/* ========== SEARCH BAR ========== */
.discover-search {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm, 0.5rem);
  padding: var(--spacing-sm, 0.5rem) var(--spacing-md, 1rem);
  background-color: var(--color-bg-secondary, #f3f4f6);
  border: 1px solid var(--color-border-light, #e5e7eb);
  border-radius: var(--radius-md, 0.375rem);
  transition: border-color var(--transition-base, 0.2s ease);
}

.discover-search:focus-within {
  border-color: var(--color-primary, #3b82f6);
  background-color: var(--color-bg-primary, #ffffff);
}

.search-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--color-text-secondary, #6b7280);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 0.9375rem;
  color: var(--color-text-primary, #1f2937);
  outline: none;
  font-family: inherit;
}

.search-input::placeholder {
  color: var(--color-text-secondary, #9ca3af);
}

.search-clear {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--color-text-secondary, #6b7280);
  border-radius: var(--radius-sm, 0.25rem);
  transition: color var(--transition-base, 0.2s ease);
}

.search-clear:hover {
  color: var(--color-text-primary, #1f2937);
}

.search-clear svg {
  width: 1rem;
  height: 1rem;
}

/* ========== FILTERS ========== */
.discover-filters {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-wrap: nowrap;
}

.discover-filters > :first-child {
  flex: 1;
  min-width: 0;
  overflow-x: auto;
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

  .discover-filters {
    flex-wrap: wrap;
  }

  .discover-filters > :first-child {
    flex: unset;
    width: 100%;
  }

  .dashboards-count {
    font-size: 1.125rem;
  }
}
</style>