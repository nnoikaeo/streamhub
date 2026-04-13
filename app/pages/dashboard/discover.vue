<template>
  <div class="discover-page-wrapper">
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
      <!-- Search Bar in breadcrumb row -->
      <template #breadcrumb-actions>
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
      </template>

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
              :regions="regions"
              @update:model-value="handleCompanyFilterChange"
            />
            <label v-if="isAdmin" class="archive-toggle">
              <input
                v-model="showArchived"
                type="checkbox"
                class="archive-toggle-checkbox"
              />
              <span class="archive-toggle-label">แสดงที่เก็บถาวร</span>
            </label>
            <button
              v-if="hasActiveFilters"
              type="button"
              class="reset-filters-btn"
              title="ล้างตัวกรองทั้งหมด"
              @click="resetAllFilters"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              ล้างตัวกรอง
            </button>
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

            <!-- Expand / Collapse All (only in grouped view, hidden on mobile) -->
            <div v-if="isGroupedView" class="folder-collapse-controls">
              <button type="button" class="collapse-ctrl-btn" title="ขยายทุกกลุ่ม" aria-label="ขยายทุกกลุ่ม" @click="expandAllFolders">ขยายทั้งหมด</button>
              <span class="collapse-ctrl-divider">|</span>
              <button type="button" class="collapse-ctrl-btn" title="ย่อทุกกลุ่ม" aria-label="ย่อทุกกลุ่ม" @click="collapseAllFolders">ย่อทั้งหมด</button>
            </div>

            <!-- Group By Switcher + Divider + View Mode Switcher (right cluster) -->
            <div class="header-right-controls">
              <GroupBySwitcher
                v-model="groupBy"
                :show-folders="folderTree.length > 0"
                :is-admin="isAdmin"
              />

              <!-- Divider -->
              <span class="header-switcher-divider" aria-hidden="true" />

              <!-- View Mode Switcher -->
              <div class="view-mode-switcher">
              <button
                type="button"
                class="view-mode-btn"
                :class="{ active: viewMode === 'grid' }"
                title="Grid view"
                aria-label="Grid view"
                @click="viewMode = 'grid'"
              >
                <!-- Grid icon: 4 squares -->
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                  <rect x="3" y="3" width="8" height="8" rx="1" />
                  <rect x="13" y="3" width="8" height="8" rx="1" />
                  <rect x="3" y="13" width="8" height="8" rx="1" />
                  <rect x="13" y="13" width="8" height="8" rx="1" />
                </svg>
              </button>
              <button
                type="button"
                class="view-mode-btn"
                :class="{ active: viewMode === 'compact' }"
                title="Compact view"
                aria-label="Compact view"
                @click="viewMode = 'compact'"
              >
                <!-- Compact icon: small grid -->
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                  <rect x="3" y="3" width="5" height="5" rx="0.5" />
                  <rect x="10" y="3" width="5" height="5" rx="0.5" />
                  <rect x="17" y="3" width="5" height="5" rx="0.5" />
                  <rect x="3" y="10" width="5" height="5" rx="0.5" />
                  <rect x="10" y="10" width="5" height="5" rx="0.5" />
                  <rect x="17" y="10" width="5" height="5" rx="0.5" />
                  <rect x="3" y="17" width="5" height="5" rx="0.5" />
                  <rect x="10" y="17" width="5" height="5" rx="0.5" />
                  <rect x="17" y="17" width="5" height="5" rx="0.5" />
                </svg>
              </button>
              <button
                type="button"
                class="view-mode-btn"
                :class="{ active: viewMode === 'list' }"
                title="List view"
                aria-label="List view"
                @click="viewMode = 'list'"
              >
                <!-- List icon: horizontal lines -->
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>
              </div>
            </div><!-- /.header-right-controls -->
          </div><!-- /.dashboards-header -->

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

          <!-- View Content: crossfade 200ms when switching view mode or group-by -->
          <Transition name="view-fade" mode="out-in">
            <div :key="`${viewMode}-${groupBy}`" class="view-content">
              <!-- List View — Grouped (Tree Table) -->
              <TreeDashboardList
                v-if="viewMode === 'list' && isGroupedView"
                :groups="visibleGroups"
                :tags="tagStore.activeTags"
                :loading="isLoading"
                :user-map="userMap"
                :collapsed-groups="collapsedFolders"
                :max-per-group="maxPerFolder"
                :visible-columns="visibleColumns"
                :folder-map="folderNameMap"
                empty-message="ไม่พบแดชบอร์ด"
                @view-dashboard="handleViewDashboard"
                @toggle-group="toggleFolder"
                @view-group="handleViewFolder"
              />

              <!-- List View — Flat (groupBy=none or specific folder) -->
              <DashboardList
                v-else-if="viewMode === 'list'"
                :dashboards="visibleDashboards"
                :tags="tagStore.activeTags"
                :loading="isLoading"
                :visible-columns="visibleColumns"
                :folder-map="folderNameMap"
                :empty-message="flatEmptyMessage"
                @view-dashboard="handleViewDashboard"
                @share-dashboard="handleShareDashboard"
                @menu-dashboard="handleMenuDashboard"
              />

              <!-- Grouped View (when showing all folders) -->
              <GroupedDashboardGrid
                v-else-if="isGroupedView"
                :groups="visibleGroups"
                :loading="isLoading"
                :user-map="userMap"
                :view-mode="viewMode"
                :collapsed-groups="collapsedFolders"
                :max-per-group="maxPerFolder"
                empty-message="ไม่พบแดชบอร์ด"
                @view-dashboard="handleViewDashboard"
                @share-dashboard="handleShareDashboard"
                @menu-dashboard="handleMenuDashboard"
                @toggle-group="toggleFolder"
                @view-group="handleViewFolder"
              />

              <!-- Flat View (groupBy=none or specific folder) -->
              <DashboardGrid
                v-else
                :dashboards="visibleDashboards"
                :loading="isLoading"
                :view-mode="viewMode"
                :empty-message="flatEmptyMessage"
                @view-dashboard="handleViewDashboard"
                @share-dashboard="handleShareDashboard"
                @menu-dashboard="handleMenuDashboard"
              />
            </div>
          </Transition>

          <!-- Lazy load sentinel — triggers next batch when scrolled into view -->
          <div v-if="hasMoreGroups && isGroupedView" ref="groupSentinelRef" class="lazy-load-sentinel" />
          <div v-if="hasMoreDashboards && !isGroupedView" ref="dashboardSentinelRef" class="lazy-load-sentinel" />
          <div v-if="lazyIsLoadingMore" class="lazy-load-indicator">
            <div class="loading-spinner" />
            <span>กำลังโหลดเพิ่ม...</span>
          </div>

          <!-- Quick Share Dialog -->
          <QuickShareDialog
            v-if="shareDialogOpen && selectedDashboard"
            v-model="shareDialogOpen"
            :dashboard-id="selectedDashboard.id"
            :available-users="availableUsers"
            @share="handleShare"
          />
        </div>
    </PageLayout>
    <div v-else class="loading-wrapper">
      <div class="loading-message">
        <div class="spinner" />
        <p>Loading dashboard discovery...</p>
      </div>
    </div>
  </div>
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
import DashboardList, { type ListColumn } from '~/components/features/DashboardList.vue'
import TreeDashboardList from '~/components/features/TreeDashboardList.vue'
import FolderDropdownFilter from '~/components/features/FolderDropdownFilter.vue'
import CompanyDropdownFilter from '~/components/features/CompanyDropdownFilter.vue'
import QuickShareDialog from '~/components/features/QuickShareDialog.vue'
import TagFilter from '~/components/features/TagFilter.vue'
import GroupBySwitcher, { type GroupByMode } from '~/components/features/GroupBySwitcher.vue'
import { computed, ref, watch, onMounted } from 'vue'
import type { ViewMode, DisplayGroup } from '~/types/dashboard'
import { useTagStore } from '~/stores/tags'
import { useAdminTags } from '~/composables/useAdminTags'
import { useAdminCompanies } from '~/composables/useAdminCompanies'
import { useAdminRegions } from '~/composables/useAdminRegions'
import { useAdminUsers } from '~/composables/useAdminUsers'
import { useCompanyAccess } from '~/composables/useCompanyAccess'
import { useLazyLoad } from '~/composables/useLazyLoad'

const route = useRoute()

// Page metadata
definePageMeta({
  middleware: 'auth',
  layout: 'default',
  keepalive: true,
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
const { regions, fetchRegions } = useAdminRegions()
const { isAdmin } = useCompanyAccess()
const selectedCompanyCode = ref<string | null>(null)
const searchQuery = ref('')
const showArchived = ref(false)

// ========== Group By Switcher ==========
const GROUP_BY_KEY = 'streamhub-discover-group-by'
const getInitialGroupBy = (): GroupByMode => {
  if (import.meta.client) {
    const saved = localStorage.getItem(GROUP_BY_KEY)
    if (saved === 'folder' || saved === 'tag' || saved === 'company' || saved === 'none') return saved
  }
  return 'none'
}
const groupBy = ref<GroupByMode>(getInitialGroupBy())
watch(groupBy, (mode) => {
  if (import.meta.client) {
    localStorage.setItem(GROUP_BY_KEY, mode)
  }
})

// ========== View Mode Switcher ==========
const VIEW_MODE_KEY = 'streamhub-discover-view-mode'
const getInitialViewMode = (): ViewMode => {
  if (import.meta.client) {
    const saved = localStorage.getItem(VIEW_MODE_KEY)
    if (saved === 'grid' || saved === 'compact' || saved === 'list') return saved
  }
  return 'list'
}
const viewMode = ref<ViewMode>(getInitialViewMode())
watch(viewMode, (mode) => {
  if (import.meta.client) {
    localStorage.setItem(VIEW_MODE_KEY, mode)
  }
})

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
      fetchRegions(),
      fetchUsers(),
    ])
  } catch (e) {
    console.warn('[discover] Failed to load tags/companies/users:', e)
  }
  // Restore tag filter from URL query params (e.g. ?tag=id1,id2)
  const tagParam = route.query.tag
  if (tagParam && typeof tagParam === 'string') {
    tagParam.split(',').filter(Boolean).forEach((id) => tagStore.toggleTagFilter(id))
  }
})

const handleCompanyFilterChange = (code: string | null) => {
  selectedCompanyCode.value = code
}

const hasActiveFilters = computed(() =>
  tagStore.selectedTagIds.length > 0
  || !!selectedFolderId.value
  || !!selectedCompanyCode.value
  || searchQuery.value.trim().length > 0
)

const resetAllFilters = () => {
  tagStore.clearTagFilter()
  selectedCompanyCode.value = null
  searchQuery.value = ''
  router.replace('/dashboard/discover')
}

const handleTagFilterUpdate = (ids: string[]) => {
  tagStore.clearTagFilter()
  ids.forEach((id) => tagStore.toggleTagFilter(id))
  // Sync tag filter to URL query params so the filter survives page refresh / copy-paste
  const query = { ...route.query }
  if (ids.length > 0) {
    query.tag = ids.join(',')
  } else {
    delete query.tag
  }
  router.replace({ query })
}

/**
 * Filtered dashboards by selected tags (AND logic) + company filter
 * NOTE: Must be declared before collapsible folder logic
 */
const filteredDashboards = computed<Dashboard[]>(() => {
  let result = dashboards.value

  // Filter out archived dashboards unless toggle is on
  if (!showArchived.value) {
    result = result.filter((d) => !d.isArchived)
  }

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
 * Grouped view — active when no folder is selected and a group-by mode is active
 */
const isGroupedView = computed(() =>
  !selectedFolderId.value && groupBy.value !== 'none' && activeGroups.value.length > 0
)

// ========== Group By: DisplayGroup computed ==========

/** Flatten nested folder tree into a flat array (includes root + all sub-folders) */
const flatFolders = computed<Folder[]>(() => {
  const result: Folder[] = []
  const visit = (folder: Folder) => {
    result.push(folder)
    folder.children?.forEach(visit)
  }
  folders.value.forEach(visit)
  return result
})

/** Group by folder as DisplayGroup[] (for future TreeDashboardList) */
const groupedByFolder = computed<DisplayGroup[]>(() => {
  if (selectedFolderId.value) return []
  const folderMap = new Map<string, { folder: Folder; dashboards: Dashboard[] }>()
  for (const folder of flatFolders.value) {
    folderMap.set(folder.id, { folder, dashboards: [] })
  }
  for (const d of filteredDashboards.value) {
    const entry = folderMap.get(d.folderId)
    if (entry) entry.dashboards.push(d)
  }
  return Array.from(folderMap.values())
    .filter((g) => g.dashboards.length > 0)
    .sort((a, b) => a.folder.name.localeCompare(b.folder.name, 'th'))
    .map((g) => ({
      id: g.folder.id,
      name: g.folder.name,
      icon: 'folder',
      dashboards: g.dashboards,
    }))
})

/** Group by tag — dashboards with multiple tags appear in each group.
 *  Dashboards with no tags go into a "ไม่มีแท็ก" group at the end. */
const groupedByTag = computed<DisplayGroup[]>(() => {
  const tagMap = new Map<string, DisplayGroup>()
  const untagged: Dashboard[] = []

  for (const tag of tagStore.activeTags) {
    tagMap.set(tag.id, {
      id: tag.id,
      name: tag.name,
      icon: 'tag',
      color: tag.color,
      dashboards: [],
    })
  }

  for (const d of filteredDashboards.value) {
    const dTags = d.tags ?? []
    if (dTags.length === 0) {
      untagged.push(d)
    } else {
      for (const tagId of dTags) {
        const group = tagMap.get(tagId)
        if (group) group.dashboards.push(d)
      }
    }
  }

  const result = Array.from(tagMap.values()).filter((g) => g.dashboards.length > 0)
  if (untagged.length > 0) {
    result.push({ id: '__untagged__', name: 'ไม่มีแท็ก', icon: 'tag', dashboards: untagged })
  }
  return result
})

/** Group by company — based on access.company array.
 *  Dashboards with no company access go into "เฉพาะสิทธิ์" group. */
const groupedByCompany = computed<DisplayGroup[]>(() => {
  const companyMap = new Map<string, DisplayGroup>()
  const directOnly: Dashboard[] = []

  const companyNameMap = new Map<string, string>()
  for (const c of companies.value) {
    companyNameMap.set(c.code, c.name)
  }

  for (const d of filteredDashboards.value) {
    const companyCodes = d.access?.company ?? []
    if (companyCodes.length === 0) {
      directOnly.push(d)
    } else {
      for (const code of companyCodes) {
        if (!companyMap.has(code)) {
          companyMap.set(code, {
            id: code,
            name: companyNameMap.get(code) ?? code,
            icon: 'company',
            dashboards: [],
          })
        }
        companyMap.get(code)!.dashboards.push(d)
      }
    }
  }

  const result = Array.from(companyMap.values())
    .sort((a, b) => a.name.localeCompare(b.name, 'th'))
  if (directOnly.length > 0) {
    result.push({ id: '__direct__', name: 'เฉพาะสิทธิ์', icon: 'company', dashboards: directOnly })
  }
  return result
})

/** Active groups based on current groupBy mode */
const activeGroups = computed<DisplayGroup[]>(() => {
  if (selectedFolderId.value) return []
  switch (groupBy.value) {
    case 'folder': return groupedByFolder.value
    case 'tag': return groupedByTag.value
    case 'company': return groupedByCompany.value
    default: return []
  }
})

// ========== Lazy Loading (Intersection Observer) ==========

const {
  visibleItems: visibleDashboards,
  hasMore: hasMoreDashboards,
  isLoadingMore: isLoadingMoreDashboards,
  sentinelRef: dashboardSentinelRef,
} = useLazyLoad(filteredDashboards, { batchSize: 12 })

const {
  visibleItems: visibleGroups,
  hasMore: hasMoreGroups,
  isLoadingMore: isLoadingMoreGroups,
  sentinelRef: groupSentinelRef,
} = useLazyLoad(activeGroups, { batchSize: 4 })

/** Unified sentinel ref — binds to whichever lazy load is active */
const lazyHasMore = computed(() =>
  isGroupedView.value ? hasMoreGroups.value : hasMoreDashboards.value,
)
const lazyIsLoadingMore = computed(() =>
  isGroupedView.value ? isLoadingMoreGroups.value : isLoadingMoreDashboards.value,
)

// ========== Adaptive Columns (List View) ==========

/** Columns visible in list view — hides the column used for grouping */
const visibleColumns = computed<ListColumn[]>(() => {
  switch (groupBy.value) {
    case 'folder': return ['tags', 'company']
    case 'tag':    return ['folder', 'company']
    case 'company': return ['folder', 'tags']
    case 'none':   return ['folder', 'tags', 'company']
    default:       return ['tags', 'company']
  }
})

/** Contextual empty message — folder-specific or generic */
const flatEmptyMessage = computed(() =>
  selectedFolderId.value ? 'ไม่มีแดชบอร์ดในโฟลเดอร์นี้' : 'ไม่พบแดชบอร์ด'
)

/** Map folderId → folder name for displaying folder chips in list items */
const folderNameMap = computed<Record<string, string>>(() => {
  const map: Record<string, string> = {}
  for (const folder of flatFolders.value) {
    map[folder.id] = folder.name
  }
  return map
})

// ========== Collapsible Folder Groups ==========
// NOTE: Must come after activeGroups is declared
const collapsedFolders = ref<Set<string>>(new Set())

const initCollapsedFolders = () => {
  const ids = activeGroups.value.map((g) => g.id)
  const newSet = new Set<string>()
  if (ids.length > 5) {
    // Collapse all except first 3
    ids.slice(3).forEach((id) => newSet.add(id))
  }
  collapsedFolders.value = newSet
}

const toggleFolder = (folderId: string) => {
  const next = new Set(collapsedFolders.value)
  if (next.has(folderId)) {
    next.delete(folderId)
  } else {
    next.add(folderId)
  }
  collapsedFolders.value = next
}

const expandAllFolders = () => {
  collapsedFolders.value = new Set()
}

const collapseAllFolders = () => {
  collapsedFolders.value = new Set(activeGroups.value.map((g) => g.id))
}

// ========== Max Cards Per Folder ==========
const maxPerFolder = computed<number | undefined>(() => {
  if (viewMode.value === 'grid') return 4
  if (viewMode.value === 'compact') return 6
  if (viewMode.value === 'list') return 8
  return undefined
})

const handleViewFolder = (folderId: string) => {
  selectFolder(folderId)
}

// Initialise collapse state once activeGroups is ready
watch(activeGroups, (groups, prevGroups) => {
  // Only set defaults on first meaningful load (going from empty → populated)
  if (!prevGroups?.length && groups.length > 0) {
    initCollapsedFolders()
  }
}, { immediate: false })

/**
 * Status text showing count + active groupBy label + filter suffixes
 */
const dashboardCountText = computed(() => {
  const selected = tagStore.selectedTagIds
  const companySuffix = selectedCompanyCode.value ? ` · บริษัท: ${selectedCompanyCode.value}` : ''
  const searchSuffix = searchQuery.value.trim() ? ` · ค้นหา: "${searchQuery.value.trim()}"` : ''

  const mode = groupBy.value

  if (!selectedFolderId.value && mode !== 'none') {
    const groups = activeGroups.value
    const count = groups.reduce((sum, g) => sum + g.dashboards.length, 0)
    const groupCount = groups.length
    if (mode === 'folder') {
      const base = `พบ ${count} แดชบอร์ด ใน ${groupCount} โฟลเดอร์`
      if (selected.length > 0) {
        const tagNames = tagStore.getTagsByIds(selected).map((t) => t.name).join(', ')
        return `${base} · แท็ก: ${tagNames}${companySuffix}${searchSuffix}`
      }
      return `${base}${companySuffix}${searchSuffix}`
    }
    if (mode === 'tag') {
      return `พบ ${count} แดชบอร์ด ใน ${groupCount} แท็ก${companySuffix}${searchSuffix}`
    }
    if (mode === 'company') {
      return `พบ ${count} แดชบอร์ด ใน ${groupCount} บริษัท${searchSuffix}`
    }
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
  padding: var(--spacing-xs, 0.25rem) var(--spacing-md, 1rem);
  background-color: var(--color-bg-secondary, #f3f4f6);
  border: 1px solid var(--color-border-light, #e5e7eb);
  border-radius: var(--radius-md, 0.375rem);
  transition: border-color var(--transition-base, 0.2s ease);
  max-width: 320px;
  width: 100%;
  margin-left: auto;
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

.reset-filters-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.25rem 0.625rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 0.8125rem;
  white-space: nowrap;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
}

.reset-filters-btn:hover {
  color: var(--color-danger, #ef4444);
  border-color: var(--color-danger, #ef4444);
  background: color-mix(in srgb, var(--color-danger, #ef4444) 8%, transparent);
}

.archive-toggle {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  cursor: pointer;
  white-space: nowrap;
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  user-select: none;
}

.archive-toggle-checkbox {
  accent-color: var(--color-primary);
  width: 1rem;
  height: 1rem;
  cursor: pointer;
}

.archive-toggle-label {
  line-height: 1;
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

/* ========== VIEW MODE SWITCHER ========== */
.header-right-controls {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs, 0.25rem);
  margin-left: auto;
}

.view-mode-switcher {
  display: flex;
  align-items: center;
  gap: 2px;
  background: var(--color-bg-secondary, #f3f4f6);
  border-radius: var(--radius-md, 0.375rem);
  padding: 2px;
}

/* Divider between GroupBySwitcher and ViewModeSwitcher */
.header-switcher-divider {
  display: block;
  width: 1px;
  height: 20px;
  background: var(--color-border-light, #e5e7eb);
  flex-shrink: 0;
  margin: 0 2px;
}

/* ========== FOLDER COLLAPSE CONTROLS ========== */
.folder-collapse-controls {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs, 0.25rem);
  margin-left: var(--spacing-sm, 0.5rem);
}

.collapse-ctrl-btn {
  background: none;
  border: none;
  padding: 2px 6px;
  font-size: 0.8rem;
  color: var(--color-primary);
  cursor: pointer;
  border-radius: var(--radius-sm, 0.25rem);

  &:hover {
    background: var(--color-bg-secondary, #f3f4f6);
  }
}

.collapse-ctrl-divider {
  font-size: 0.75rem;
  color: var(--color-border-light, #e5e7eb);
}

.view-mode-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--radius-sm, 0.25rem);
  background: transparent;
  color: var(--color-text-secondary, #6b7280);
  cursor: pointer;
  transition: all var(--transition-base, 0.2s ease);
}

.view-mode-btn:hover {
  color: var(--color-text-primary, #1f2937);
  background: var(--color-bg-primary, #ffffff);
}

.view-mode-btn.active {
  background: var(--color-primary, #3b82f6);
  color: #ffffff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.view-mode-btn svg {
  width: 18px;
  height: 18px;
}

/* ========== LAZY LOAD SENTINEL & INDICATOR ========== */
.lazy-load-sentinel {
  height: 1px;
  visibility: hidden;
}

.lazy-load-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem 0;
  color: var(--color-text-secondary, #6b7280);
  font-size: 0.875rem;
}

.lazy-load-indicator .loading-spinner {
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid var(--color-border-light, #e5e7eb);
  border-top-color: var(--color-primary, #3b82f6);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* ========== VIEW MODE FADE TRANSITION ========== */
.view-fade-enter-active,
.view-fade-leave-active {
  transition: opacity 200ms ease;
}

.view-fade-enter-from,
.view-fade-leave-to {
  opacity: 0;
}

/* ========== RESPONSIVE ========== */

/* Tablet */
@media (max-width: 1024px) {
  .discover-main-content {
    padding: var(--spacing-md) var(--spacing-lg) 0;
  }
}

/* Mobile */
@media (max-width: 768px) {
  .discover-search {
    max-width: 100%;
    flex-basis: 100%;
  }

  .discover-main-content {
    padding: var(--spacing-sm) var(--spacing-md) 0;
  }

  .discover-filters {
    flex-wrap: wrap;
  }

  .discover-filters > :first-child {
    flex: unset;
    width: 100%;
  }

  /* Header: allow wrapping on small screens */
  .dashboards-header {
    flex-wrap: wrap;
    row-gap: var(--spacing-xs, 0.25rem);
  }

  .header-icon {
    display: none;
  }

  .dashboards-count {
    font-size: 1rem;
    flex: 1;
    min-width: 0;
  }

  /* Hide collapse controls on mobile */
  .folder-collapse-controls {
    display: none;
  }

  /* View mode switcher stays on same row as count */
  .view-mode-switcher {
    flex-shrink: 0;
  }

  .view-mode-btn {
    width: 28px;
    height: 28px;
  }

  .view-mode-btn svg {
    width: 15px;
    height: 15px;
  }

  /* Shrink GroupBySwitcher on mobile to match view mode buttons */
  .header-right-controls :deep(.group-by-btn) {
    width: 28px;
    height: 28px;
  }

  .header-right-controls :deep(.group-by-btn svg) {
    width: 14px;
    height: 14px;
  }

  /* Thinner divider on mobile */
  .header-switcher-divider {
    height: 16px;
  }
}
</style>