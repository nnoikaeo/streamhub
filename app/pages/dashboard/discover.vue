<template>
  <ClientOnly>
    <div v-if="!isLoading && rootFolders.length > 0" class="discover-page-wrapper">
      <DiscoverPageLayout>
        <!-- Sidebar: Folder Tree Navigation -->
        <template #sidebar>
          <FolderSidebar
            :folders="rootFolders"
            :selected-folder-id="selectedFolderId"
            :allow-search="true"
            :allow-create="currentUserRole === 'admin'"
            @select-folder="(folder: Folder) => handleFolderSelect(folder.id)"
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
import { computed, ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '~/composables/useAuth'
import { useDashboardService } from '~/composables/useDashboardService'
import type { Folder, Dashboard } from '~/types/dashboard'
import DiscoverPageLayout from '~/components/compositions/DiscoverPageLayout.vue'
import FolderSidebar from '~/components/features/FolderSidebar.vue'
import DashboardGrid from '~/components/features/DashboardGrid.vue'
import QuickShareDialog from '~/components/features/QuickShareDialog.vue'

// Page metadata
definePageMeta({
  middleware: 'auth',
  layout: 'default',
  ssr: false,
})

// Debug logging - MUST BE FIRST
const DEBUG = true
const log = (label: string, data?: any) => {
  if (DEBUG) {
    if (data !== undefined) {
      console.log(`🔍 [discover.vue] ${label}`, data)
    } else {
      console.log(`🔍 [discover.vue] ${label}`)
    }
  }
}

// Router and Auth
const router = useRouter()
const route = useRoute()
log('Calling useAuth composable')
const authComposable = useAuth()
log('useAuth composable returned', { keys: Object.keys(authComposable) })
const { user, loading, isAuthenticated, initAuth } = authComposable
log('Destructured from useAuth', { user: !!user, loading: !!loading, isAuthenticated: !!isAuthenticated, initAuth: !!initAuth })

const dashboardService = useDashboardService()

// State
const selectedFolderId = ref<string | null>(null)
const dashboards = ref<Dashboard[]>([])
const rootFolders = ref<Folder[]>([])
const currentFolder = ref<Folder | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)
const shareDialogOpen = ref(false)
const selectedDashboard = ref<Dashboard | null>(null)
const folderPath = ref<Folder[]>([])
const availableUsers = ref<any[]>([])
const infiniteScrollSentinel = ref<HTMLElement | null>(null)

// Computed properties
const currentUserId = computed(() => {
  try {
    const uid = user?.value?.uid || ''
    log('currentUserId computed', { uid, userExists: !!user, userValueExists: !!user?.value })
    return uid
  } catch (err) {
    log('currentUserId computed ERROR', err)
    return ''
  }
})

const currentUserRole = computed(() => {
  try {
    const role = user?.value?.role || 'user'
    log('currentUserRole computed', { role })
    return role
  } catch (err) {
    log('currentUserRole computed ERROR', err)
    return 'user'
  }
})

const breadcrumbItems = computed(() => {
  log('breadcrumbItems computed', { folderPathLength: folderPath.value?.length })
  return [
    { label: 'Dashboard', to: '/dashboard/discover' },
    ...(folderPath.value?.map((folder) => ({
      label: folder.name,
      to: `/dashboard/discover?folder=${folder.id}`,
    })) || []),
  ]
})

// Watch for route query param changes (breadcrumb navigation)
watch(() => route.query.folder, (newFolderId) => {
  log('route.query.folder changed', { newFolderId })
  if (newFolderId && typeof newFolderId === 'string') {
    selectedFolderId.value = newFolderId
    loadDashboards()
  }
})

const loadFolders = async () => {
  try {
    log('loadFolders started')
    isLoading.value = true
    error.value = null

    if (!user?.value) {
      log('loadFolders error: user not authenticated')
      error.value = 'User not authenticated'
      return
    }

    const uid = user.value.uid
    const company = (user.value as any).company || 'default'
    log('loadFolders calling service', { uid, company })
    const response = await dashboardService.getFolders(uid, company)
    rootFolders.value = response.folders
    log('loadFolders completed', { folderCount: rootFolders.value.length })

    // Set default folder to root if not specified
    if (!selectedFolderId.value && rootFolders.value.length > 0) {
      const firstFolder = rootFolders.value[0]
      if (firstFolder) {
        selectedFolderId.value = firstFolder.id
        log('loadFolders set default folder', { folderId: selectedFolderId.value })
      }
    }
  } catch (err) {
    log('loadFolders error', err)
    error.value = err instanceof Error ? err.message : 'Failed to load folders'
    console.error('Error loading folders:', err)
  } finally {
    isLoading.value = false
  }
}

const loadDashboards = async () => {
  try {
    log('loadDashboards started', { userId: user?.value?.uid, folderId: selectedFolderId.value })
    isLoading.value = true
    error.value = null

    if (!user?.value || !selectedFolderId.value) {
      log('loadDashboards skipped: missing user or folderId')
      return
    }

    const uid = user.value.uid
    const company = (user.value as any).company || 'default'
    log('loadDashboards calling service', { uid, company, folderId: selectedFolderId.value })
    const response = await dashboardService.getDashboards(uid, company, {
      folderId: selectedFolderId.value,
    })

    dashboards.value = response.dashboards
    log('loadDashboards got dashboards', { count: dashboards.value.length })

    // Load current folder info
    log('loadDashboards loading folder info')
    const folder = await dashboardService.getFolder(selectedFolderId.value)
    if (folder) {
      currentFolder.value = folder
      log('loadDashboards got folder', { name: folder.name })
      
      log('loadDashboards loading folder path')
      const path = await dashboardService.getFolderPath(selectedFolderId.value)
      folderPath.value = path || []
      log('loadDashboards got folder path', { pathLength: folderPath.value.length })
    }
  } catch (err) {
    log('loadDashboards error', err)
    error.value = err instanceof Error ? err.message : 'Failed to load dashboards'
    console.error('Error loading dashboards:', err)
  } finally {
    isLoading.value = false
  }
}

// Event handlers
const handleFolderSelect = async (folderId: string) => {
  log('handleFolderSelect', { folderId })
  selectedFolderId.value = folderId
  await loadDashboards()
}


const handleViewDashboard = async (dashboard: Dashboard) => {
  log('handleViewDashboard', { dashboardId: dashboard.id })
  await router.push(`/dashboard/view/${dashboard.id}`)
}

const handleShareDashboard = (dashboard: Dashboard) => {
  log('handleShareDashboard', { dashboardId: dashboard.id })
  selectedDashboard.value = dashboard
  shareDialogOpen.value = true
}

const handleMenuDashboard = (dashboard: Dashboard, event: MouseEvent) => {
  log('handleMenuDashboard', { dashboardId: dashboard.id })
  console.log('Menu action event:', event, 'Dashboard:', dashboard.id)
  // Handle menu actions here
}

const handleShare = async (payload: { dashboardId: string; userIds: string[]; expiryDate?: string }) => {
  log('handleShare', { dashboardId: payload.dashboardId, userCount: payload.userIds.length })
  try {
    console.log('Share dashboard:', payload)
    // API call would go here
    error.value = null
  } catch (err) {
    log('handleShare error', err)
    error.value = err instanceof Error ? err.message : 'Failed to share dashboard'
    console.error('Error sharing dashboard:', err)
  }
}

const handleCreateFolder = () => {
  log('handleCreateFolder', { folderId: selectedFolderId.value })
  // TODO: Implement folder creation dialog
  console.log('Create folder in:', selectedFolderId.value)
}

// Lifecycle
onMounted(async () => {
  log('onMounted: Page mounted, starting initialization')
  try {
    log('onMounted: Initial user state', { userExists: !!user, userValueExists: !!user?.value })
    
    // Wait for user to be loaded (max 5 seconds)
    log('onMounted: Waiting for user authentication')
    let attempts = 0
    while (!user?.value && attempts < 50) {
      await new Promise((resolve) => setTimeout(resolve, 100))
      attempts++
    }

    log('onMounted: Auth wait completed', { attempts, userLoaded: !!user?.value })

    if (!user?.value) {
      log('onMounted: ERROR - User still not loaded after 5 seconds')
      error.value = 'User authentication failed. Please reload the page.'
      return
    }

    const uid = user.value.uid
    const company = (user.value as any).company || 'default'
    log('onMounted: User authenticated', { uid, company })

    // Check if folder is specified in query params first
    if (route.query.folder) {
      selectedFolderId.value = route.query.folder as string
      log('onMounted: Folder from query param', { folderId: selectedFolderId.value })
    }
    
    log('onMounted: Calling loadFolders')
    await loadFolders()
    
    log('onMounted: After loadFolders', { selectedFolderId: selectedFolderId.value, folderCount: rootFolders.value.length })
    
    // If no folder selected yet, use first folder
    if (!selectedFolderId.value && rootFolders.value.length > 0) {
      const firstFolder = rootFolders.value[0]
      if (firstFolder) {
        selectedFolderId.value = firstFolder.id
        log('onMounted: Set default folder', { folderId: selectedFolderId.value })
      }
    }
    
    log('onMounted: Calling loadDashboards')
    await loadDashboards()

    log('onMounted: Initialization complete', { dashboardCount: dashboards.value.length })

    // Setup infinite scroll sentinel
    log('onMounted: Setting up infinite scroll')
    if (infiniteScrollSentinel.value) {
      const observer = new IntersectionObserver(
        (entries) => {
          const entry = entries?.[0]
          if (!entry) return
          log('Infinite scroll sentinel visibility', { isVisible: entry.isIntersecting })
          // When sentinel becomes visible, load more dashboards
          if (entry.isIntersecting && !isLoading.value && dashboards.value.length > 0) {
            log('Loading more dashboards via infinite scroll')
            loadDashboards()
          }
        },
        {
          root: null,
          rootMargin: '100px', // Load when 100px away from bottom
          threshold: 0.01
        }
      )
      observer.observe(infiniteScrollSentinel.value)
    }
  } catch (err) {
    log('onMounted: CATCH block error', err)
    error.value = err instanceof Error ? err.message : 'Failed to initialize page'
    console.error('Initialization error:', err)
  }
})
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
  gap: 1rem;
  color: white;
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
  gap: 1.5rem;
  padding: 0 2rem;
}

/* ========== DASHBOARDS HEADER ========== */
.dashboards-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
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
    padding: 0 1rem;
  }

  .dashboards-count {
    font-size: 1.125rem;
  }
}
</style>