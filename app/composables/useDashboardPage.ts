import { computed, ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '~/composables/useAuth'
import { useDashboardService } from '~/composables/useDashboardService'
import { useDashboardStore } from '~/stores/dashboard'
import { usePermissionsStore } from '~/stores/permissions'
import type { Dashboard, Folder } from '~/types/dashboard'

export interface UseDashboardPageOptions {
  initialFolderId?: string | null
  enableInfiniteScroll?: boolean
  autoLoad?: boolean
  onFolderChange?: (folderId: string) => void
  onDashboardSelect?: (dashboard: Dashboard) => void
}

/**
 * useDashboardPage - Dashboard Page Logic Composable
 *
 * Strategy 4 Implementation: Hybrid Approach using Stores + Composables
 *
 * Encapsulates all dashboard page logic:
 * - Folder loading and selection
 * - Dashboard loading and filtering
 * - Breadcrumb navigation
 * - Permission checks for UI actions
 * - Infinite scroll management
 * - Error handling
 *
 * Usage in discover.vue:
 * ```typescript
 * const {
 *   // Data
 *   dashboards,
 *   folders,
 *   currentFolder,
 *   folderPath,
 *   breadcrumbItems,
 *   isLoading,
 *   error,
 *
 *   // Permissions
 *   canCreateFolder,
 *   canShareDashboard,
 *
 *   // Methods
 *   selectFolder,
 *   loadDashboards,
 *   handleViewDashboard,
 *   handleShareDashboard,
 * } = useDashboardPage()
 * ```
 *
 * Benefits:
 * - Logic reusable across multiple pages (discover, admin, etc.)
 * - Permissions automatically checked (no need for inline v-if checks)
 * - State management through Pinia (shared across app)
 * - Easy to test (can mock composable)
 * - Cleaner component code (less boilerplate)
 */
export const useDashboardPage = (options: UseDashboardPageOptions = {}) => {
  const router = useRouter()
  const route = useRoute()
  const { user } = useAuth()
  const dashboardService = useDashboardService()
  const dashboardStore = useDashboardStore()
  const permissionsStore = usePermissionsStore()

  // Extract options
  const {
    initialFolderId = null,
    enableInfiniteScroll = true,
    autoLoad = true,
    onFolderChange,
    onDashboardSelect,
  } = options

  // ========== Local State ==========
  const selectedDashboard = ref<Dashboard | null>(null)
  const shareDialogOpen = ref(false)
  const availableUsers = ref<any[]>([])
  const folderPath = ref<Folder[]>([])
  const infiniteScrollSentinel = ref<HTMLElement | null>(null)
  const isInitializing = ref(true)

  const DEBUG = true
  const log = (label: string, data?: any) => {
    if (DEBUG) {
      if (data !== undefined) {
        console.log(`🔍 [useDashboardPage] ${label}`, data)
      } else {
        console.log(`🔍 [useDashboardPage] ${label}`)
      }
    }
  }

  // ========== Computed Properties ==========

  const currentUserId = computed(() => user?.value?.uid || '')
  const currentUserRole = computed(() => user?.value?.role || 'user')

  const dashboards = computed(() => dashboardStore.dashboards)
  const folders = computed(() => dashboardStore.folders)
  const selectedFolderId = computed(() => dashboardStore.selectedFolderId)
  const currentFolder = computed(() => dashboardStore.currentFolder)
  const isLoading = computed(() => dashboardStore.isLoading)
  const error = computed(() => dashboardStore.error)

  const breadcrumbItems = computed(() => {
    return [
      { label: 'รายการแดชบอร์ด', to: '/dashboard/discover' },
      ...(folderPath.value?.map((folder) => ({
        label: folder.name,
        to: `/dashboard/discover?folder=${folder.id}`,
      })) || []),
    ]
  })

  // ========== Permissions ==========
  const canCreateFolder = computed(() => permissionsStore.can('canCreateFolder'))
  const canShareDashboard = computed(() => permissionsStore.can('canShareDashboard'))
  const canDeleteDashboard = computed(() => permissionsStore.can('canDeleteDashboard'))
  const canEditDashboard = computed(() => permissionsStore.can('canEditDashboard'))

  // ========== Service Methods ==========

  /**
   * Load all root folders
   */
  const loadFolders = async () => {
    try {
      log('loadFolders started')
      dashboardStore.setLoading(true)
      dashboardStore.clearError()

      if (!user?.value) {
        log('loadFolders error: user not authenticated')
        dashboardStore.setError('User not authenticated')
        return
      }

      const uid = user.value.uid
      const company = (user.value as any).company || 'default'

      // Check cache
      if (dashboardStore.isFoldersCacheValid(uid, company)) {
        log('loadFolders: Using cached folders')
        dashboardStore.setLoading(false)
        return
      }

      log('loadFolders calling service', { uid, company })
      const response = await dashboardService.getFolders(uid, company)
      dashboardStore.setFolders(response.folders)
      dashboardStore.updateFoldersCacheKey(uid, company)
      log('loadFolders completed', { folderCount: response.folders.length })

      // Note: Do not auto-select folder - let user choose
      // Only select folder if specified in URL query params
    } catch (err) {
      log('loadFolders error', err)
      dashboardStore.setError(
        err instanceof Error ? err.message : 'Failed to load folders'
      )
      console.error('Error loading folders:', err)
    } finally {
      dashboardStore.setLoading(false)
    }
  }

  /**
   * Load dashboards for current folder or all dashboards if no folder selected
   */
  const loadDashboards = async () => {
    try {
      log('loadDashboards started', {
        userId: user?.value?.uid,
        folderId: selectedFolderId.value,
      })
      dashboardStore.setLoading(true)
      dashboardStore.clearError()

      if (!user?.value) {
        log('loadDashboards skipped: missing user')
        return
      }

      const uid = user.value.uid
      const company = (user.value as any).company || 'default'
      const folderId = selectedFolderId.value || 'root' // Use 'root' as cache key when no folder selected

      // Check cache
      if (dashboardStore.isDashboardsCacheValid(uid, folderId, company)) {
        log('loadDashboards: Using cached dashboards')
        dashboardStore.setLoading(false)
        return
      }

      log('loadDashboards calling service', { uid, company, folderId: selectedFolderId.value })
      const response = await dashboardService.getDashboards(uid, company, {
        folderId: selectedFolderId.value || undefined, // Pass undefined if no folder selected to get all dashboards
      })

      dashboardStore.setDashboards(response.dashboards)
      dashboardStore.updateDashboardsCacheKey(uid, folderId, company)
      log('loadDashboards got dashboards', { count: response.dashboards.length })

      // Load folder path for breadcrumbs (only if folder is selected)
      if (folderId) {
        log('loadDashboards loading folder path')
        const path = await dashboardService.getFolderPath(folderId)
        folderPath.value = path || []
        log('loadDashboards got folder path', { pathLength: folderPath.value.length })
      }
    } catch (err) {
      log('loadDashboards error', err)
      dashboardStore.setError(
        err instanceof Error ? err.message : 'Failed to load dashboards'
      )
      console.error('Error loading dashboards:', err)
    } finally {
      dashboardStore.setLoading(false)
    }
  }

  // ========== Event Handlers ==========

  /**
   * Handle folder selection from sidebar
   */
  const selectFolder = async (folderId: string) => {
    log('selectFolder', { folderId })
    dashboardStore.selectFolder(folderId)
    await router.push(`/dashboard/discover?folder=${folderId}`)
    await loadDashboards()
    onFolderChange?.(folderId)
  }

  /**
   * Handle dashboard view (open dashboard)
   */
  const handleViewDashboard = async (dashboard: Dashboard) => {
    log('handleViewDashboard', { dashboardId: dashboard.id })

    // Check permission
    if (!permissionsStore.can('canViewDashboards')) {
      dashboardStore.setError('You do not have permission to view dashboards')
      return
    }

    dashboardStore.selectDashboard(dashboard.id)
    onDashboardSelect?.(dashboard)
    await router.push(`/dashboard/view/${dashboard.id}`)
  }

  /**
   * Handle dashboard share
   */
  const handleShareDashboard = (dashboard: Dashboard) => {
    log('handleShareDashboard', { dashboardId: dashboard.id })

    // Check permission
    if (!canShareDashboard.value) {
      dashboardStore.setError('You do not have permission to share dashboards')
      return
    }

    selectedDashboard.value = dashboard
    shareDialogOpen.value = true
  }

  /**
   * Handle dashboard menu actions
   */
  const handleMenuDashboard = (dashboard: Dashboard, event: MouseEvent) => {
    log('handleMenuDashboard', { dashboardId: dashboard.id })
    console.log('Menu action event:', event, 'Dashboard:', dashboard.id)
  }

  /**
   * Handle share confirmation
   */
  const handleShare = async (payload: {
    dashboardId: string
    userIds: string[]
    expiryDate?: string
  }) => {
    log('handleShare', { dashboardId: payload.dashboardId, userCount: payload.userIds.length })
    try {
      console.log('Share dashboard:', payload)
      // API call would go here
      dashboardStore.clearError()
    } catch (err) {
      log('handleShare error', err)
      dashboardStore.setError(
        err instanceof Error ? err.message : 'Failed to share dashboard'
      )
      console.error('Error sharing dashboard:', err)
    }
  }

  /**
   * Handle folder creation
   */
  const handleCreateFolder = () => {
    log('handleCreateFolder', { folderId: selectedFolderId.value })

    // Check permission
    if (!canCreateFolder.value) {
      dashboardStore.setError('You do not have permission to create folders')
      return
    }

    console.log('Create folder in:', selectedFolderId.value)
    // TODO: Implement folder creation dialog
  }

  // ========== Watchers ==========

  /**
   * Watch for route query param changes (breadcrumb navigation)
   */
  watch(
    () => route.query.folder,
    (newFolderId) => {
      log('route.query.folder changed', { newFolderId })
      if (newFolderId && typeof newFolderId === 'string') {
        // User selected a specific folder
        dashboardStore.selectFolder(newFolderId)
        loadDashboards()
      } else if (newFolderId === undefined) {
        // Folder param was removed - clear selection and show root level
        log('Clearing folder selection', { newFolderId })
        dashboardStore.selectFolder(null)
        folderPath.value = []
        loadDashboards()
      }
    }
  )

  // ========== Lifecycle ==========

  /**
   * Setup infinite scroll sentinel
   */
  const setupInfiniteScroll = () => {
    if (!enableInfiniteScroll || !infiniteScrollSentinel.value) {
      return
    }

    log('Setting up infinite scroll')
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
        threshold: 0.01,
      }
    )
    observer.observe(infiniteScrollSentinel.value)
  }

  /**
   * Initialize dashboard page
   */
  const initialize = async () => {
    log('initialize: Starting page initialization')
    try {
      isInitializing.value = true

      // Wait for user to be loaded
      log('initialize: Waiting for user authentication')
      let attempts = 0
      while (!user?.value && attempts < 50) {
        await new Promise((resolve) => setTimeout(resolve, 100))
        attempts++
      }

      log('initialize: Auth wait completed', { attempts, userLoaded: !!user?.value })

      if (!user?.value) {
        log('initialize: ERROR - User still not loaded after 5 seconds')
        dashboardStore.setError('User authentication failed. Please reload the page.')
        return
      }

      const uid = user.value.uid
      const company = (user.value as any).company || 'default'
      log('initialize: User authenticated', { uid, company })

      // Check if folder is specified in query params
      if (route.query.folder) {
        dashboardStore.selectFolder(route.query.folder as string)
        log('initialize: Folder from query param', {
          folderId: route.query.folder,
        })
      }

      // Load folders
      log('initialize: Calling loadFolders')
      await loadFolders()

      // Note: Do not auto-select folder - let user choose
      // Folder will only be selected if:
      // 1. Specified in URL query params (handled above)
      // 2. User clicks on folder in sidebar

      // Load dashboards (will load ALL dashboards if no folder selected)
      log('initialize: Calling loadDashboards')
      await loadDashboards()

      log('initialize: Initialization complete', {
        dashboardCount: dashboards.value.length,
      })

      // Setup infinite scroll
      setupInfiniteScroll()
    } catch (err) {
      log('initialize: CATCH block error', err)
      dashboardStore.setError(
        err instanceof Error ? err.message : 'Failed to initialize page'
      )
      console.error('Initialization error:', err)
    } finally {
      isInitializing.value = false
    }
  }

  // Auto-initialize when mounted
  onMounted(() => {
    initialize()
  })

  // ========== Return API ==========

  return {
    // Data
    dashboards,
    folders,
    currentFolder,
    selectedFolderId,
    selectedDashboard,
    folderPath,
    breadcrumbItems,
    isLoading,
    error,
    shareDialogOpen,
    availableUsers,
    infiniteScrollSentinel,
    isInitializing,

    // Permissions
    canCreateFolder,
    canShareDashboard,
    canDeleteDashboard,
    canEditDashboard,

    // User Info
    currentUserId,
    currentUserRole,

    // Methods
    loadFolders,
    loadDashboards,
    selectFolder,
    handleViewDashboard,
    handleShareDashboard,
    handleMenuDashboard,
    handleShare,
    handleCreateFolder,
    setupInfiniteScroll,
    initialize,

    // Store access (for advanced usage)
    dashboardStore,
    permissionsStore,
  }
}
