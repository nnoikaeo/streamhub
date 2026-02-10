import { computed, ref, onMounted } from 'vue'

export interface PaginationOptions {
  pageSize?: number
  enableInfiniteScroll?: boolean
  autoLoad?: boolean
}

export interface UsePaginatedListOptions<T> extends PaginationOptions {
  fetchFunction: (page: number, pageSize: number) => Promise<{ items: T[]; total: number }>
  onError?: (error: Error) => void
  onSuccess?: (items: T[]) => void
}

/**
 * usePaginatedList - Generic Pagination & Infinite Scroll Composable
 *
 * Strategy 4 Implementation: Reusable Composable Pattern
 *
 * Generic composable for any paginated list (dashboards, projects, users, etc.)
 * Supports both traditional pagination and infinite scroll
 *
 * Features:
 * - Automatic page management
 * - Infinite scroll support
 * - Error handling
 * - Loading states
 * - Empty state detection
 * - Total count tracking
 *
 * Usage Example 1 - Dashboards (infinite scroll):
 * ```typescript
 * const { items, isLoading, hasMore, loadMore } = usePaginatedList({
 *   pageSize: 20,
 *   enableInfiniteScroll: true,
 *   fetchFunction: async (page, pageSize) => {
 *     const response = await dashboardService.getDashboards(page, pageSize)
 *     return { items: response.dashboards, total: response.total }
 *   }
 * })
 * ```
 *
 * Usage Example 2 - Projects (traditional pagination):
 * ```typescript
 * const { items, isLoading, currentPage, totalPages, goToPage } = usePaginatedList({
 *   pageSize: 10,
 *   enableInfiniteScroll: false,
 *   fetchFunction: async (page, pageSize) => {
 *     const response = await projectService.getProjects(page, pageSize)
 *     return { items: response.projects, total: response.total }
 *   }
 * })
 * ```
 *
 * Benefits:
 * - Reusable across any paginated list
 * - Supports multiple pagination styles
 * - Clear separation of concerns
 * - Easy to test (pure composable)
 * - Type-safe with generics
 */
export const usePaginatedList = <T>({
  pageSize = 20,
  enableInfiniteScroll = true,
  autoLoad = true,
  fetchFunction,
  onError,
  onSuccess,
}: UsePaginatedListOptions<T>) => {
  // ========== State ==========
  const items = ref<T[]>([])
  const currentPage = ref(1)
  const totalCount = ref(0)
  const isLoading = ref(false)
  const error = ref<Error | null>(null)
  const sentinelElement = ref<HTMLElement | null>(null)

  const DEBUG = true
  const log = (label: string, data?: any) => {
    if (DEBUG) {
      if (data !== undefined) {
        console.log(`🔍 [usePaginatedList] ${label}`, data)
      } else {
        console.log(`🔍 [usePaginatedList] ${label}`)
      }
    }
  }

  // ========== Computed ==========

  /**
   * Total pages calculated from total count
   */
  const totalPages = computed(() => Math.ceil(totalCount.value / pageSize))

  /**
   * Check if there are more pages to load
   */
  const hasMore = computed(() => currentPage.value < totalPages.value)

  /**
   * Check if list is empty (no items loaded yet)
   */
  const isEmpty = computed(() => items.value.length === 0 && !isLoading.value)

  /**
   * Check if showing loading state (initial load)
   */
  const isInitialLoading = computed(() => isLoading.value && items.value.length === 0)

  /**
   * Check if showing load more spinner (pagination)
   */
  const isLoadingMore = computed(() => isLoading.value && items.value.length > 0)

  /**
   * Display current range (e.g., "1-20 of 100")
   */
  const displayRange = computed(() => {
    const end = Math.min(currentPage.value * pageSize, totalCount.value)
    if (totalCount.value === 0) return '0 of 0'
    return `${items.value.length > 0 ? 1 : 0}-${end} of ${totalCount.value}`
  })

  // ========== Methods ==========

  /**
   * Fetch items for a specific page
   */
  const fetchPage = async (page: number) => {
    try {
      log('fetchPage started', { page, pageSize })
      isLoading.value = true
      error.value = null

      const response = await fetchFunction(page, pageSize)
      totalCount.value = response.total

      // For first page, replace items; for other pages, append
      if (page === 1) {
        items.value = response.items
      } else {
        items.value.push(...response.items)
      }

      currentPage.value = page
      onSuccess?.(response.items)

      log('fetchPage completed', {
        page,
        itemsCount: response.items.length,
        totalCount: response.total,
      })
    } catch (err) {
      const error_obj = err instanceof Error ? err : new Error(String(err))
      error.value = error_obj
      onError?.(error_obj)
      log('fetchPage error', error_obj)
      console.error('Error fetching page:', error_obj)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Load first page
   */
  const loadFirstPage = async () => {
    log('loadFirstPage')
    await fetchPage(1)
  }

  /**
   * Load next page (for pagination)
   */
  const loadNextPage = async () => {
    if (!hasMore.value || isLoading.value) {
      log('loadNextPage skipped: no more pages or already loading')
      return
    }
    log('loadNextPage')
    await fetchPage(currentPage.value + 1)
  }

  /**
   * Load previous page (for pagination)
   */
  const loadPreviousPage = async () => {
    if (currentPage.value === 1 || isLoading.value) {
      log('loadPreviousPage skipped: already on first page or already loading')
      return
    }
    log('loadPreviousPage')
    await fetchPage(currentPage.value - 1)
  }

  /**
   * Go to specific page (for pagination)
   */
  const goToPage = async (page: number) => {
    if (page < 1 || page > totalPages.value || isLoading.value) {
      log('goToPage skipped: invalid page or already loading', { page, totalPages: totalPages.value })
      return
    }
    log('goToPage', { page })
    await fetchPage(page)
  }

  /**
   * Load more (alias for loadNextPage, more intuitive for infinite scroll)
   */
  const loadMore = async () => {
    await loadNextPage()
  }

  /**
   * Reload current page
   */
  const reload = async () => {
    log('reload')
    await fetchPage(currentPage.value)
  }

  /**
   * Reset pagination
   */
  const reset = () => {
    log('reset')
    items.value = []
    currentPage.value = 1
    totalCount.value = 0
    error.value = null
    isLoading.value = false
  }

  // ========== Infinite Scroll Setup ==========

  /**
   * Setup infinite scroll observer on sentinel element
   */
  const setupInfiniteScroll = () => {
    if (!enableInfiniteScroll || !sentinelElement.value) {
      log('setupInfiniteScroll skipped: not enabled or sentinel not found')
      return
    }

    log('setupInfiniteScroll: Setting up observer')
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries?.[0]
        if (!entry) return

        log('setupInfiniteScroll: Sentinel visibility', { isVisible: entry.isIntersecting })

        // When sentinel becomes visible, load more items
        if (entry.isIntersecting && !isLoading.value && hasMore.value) {
          log('setupInfiniteScroll: Loading more items')
          loadMore()
        }
      },
      {
        root: null,
        rootMargin: '100px', // Load when 100px away from bottom
        threshold: 0.01,
      }
    )

    observer.observe(sentinelElement.value)

    // Return cleanup function
    return () => {
      if (sentinelElement.value) {
        observer.unobserve(sentinelElement.value)
      }
    }
  }

  // ========== Lifecycle ==========

  /**
   * Auto-load first page if autoLoad is enabled
   */
  onMounted(() => {
    if (autoLoad) {
      log('onMounted: Auto-loading first page')
      loadFirstPage()
    }
  })

  // ========== Return API ==========

  return {
    // State
    items,
    currentPage,
    totalCount,
    isLoading,
    error,
    sentinelElement,

    // Computed
    totalPages,
    hasMore,
    isEmpty,
    isInitialLoading,
    isLoadingMore,
    displayRange,

    // Methods
    fetchPage,
    loadFirstPage,
    loadNextPage,
    loadPreviousPage,
    goToPage,
    loadMore,
    reload,
    reset,

    // Infinite Scroll
    setupInfiniteScroll,
  }
}
