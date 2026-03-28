import { ref, computed, watch, onBeforeUnmount, type Ref, type ComputedRef } from 'vue'

export interface UseLazyLoadOptions {
  /** Number of items to show per batch (default: 12) */
  batchSize?: number
  /** IntersectionObserver rootMargin — how early to trigger next batch (default: '200px') */
  rootMargin?: string
}

/**
 * useLazyLoad — Client-side batch rendering with Intersection Observer
 *
 * Takes a reactive list of items and renders them in batches.
 * When the sentinel element scrolls into view, the next batch is appended.
 *
 * Usage:
 * ```vue
 * <script setup>
 * const { visibleItems, hasMore, isLoadingMore, sentinelRef } = useLazyLoad(allItems, { batchSize: 12 })
 * </script>
 * <template>
 *   <ItemCard v-for="item in visibleItems" :key="item.id" :item="item" />
 *   <div v-if="hasMore" ref="sentinelRef" class="lazy-sentinel" />
 *   <LoadingSpinner v-if="isLoadingMore" />
 * </template>
 * ```
 */
export function useLazyLoad<T>(
  items: Ref<T[]> | ComputedRef<T[]>,
  options: UseLazyLoadOptions = {},
) {
  const { batchSize = 12, rootMargin = '200px' } = options

  const visibleCount = ref(batchSize)
  const sentinelRef = ref<HTMLElement | null>(null)
  const isLoadingMore = ref(false)
  let observer: IntersectionObserver | null = null

  const visibleItems = computed(() => items.value.slice(0, visibleCount.value))

  const hasMore = computed(() => visibleCount.value < items.value.length)

  const totalCount = computed(() => items.value.length)

  const loadMore = () => {
    if (!hasMore.value || isLoadingMore.value) return
    isLoadingMore.value = true
    requestAnimationFrame(() => {
      visibleCount.value = Math.min(visibleCount.value + batchSize, items.value.length)
      isLoadingMore.value = false
    })
  }

  const reset = () => {
    visibleCount.value = batchSize
  }

  // Reset visible count when source data changes (filter, search, folder switch)
  watch(() => items.value, () => {
    reset()
  })

  // Setup / teardown IntersectionObserver when sentinel ref changes
  const cleanupObserver = () => {
    if (observer) {
      observer.disconnect()
      observer = null
    }
  }

  watch(sentinelRef, (el) => {
    cleanupObserver()
    if (!el) return
    observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore.value) {
          loadMore()
        }
      },
      { rootMargin },
    )
    observer.observe(el)
  })

  onBeforeUnmount(cleanupObserver)

  return {
    /** Items sliced to the current visible batch */
    visibleItems,
    /** Whether there are more items to load */
    hasMore,
    /** True while appending next batch (brief, used for loading indicator) */
    isLoadingMore,
    /** Total number of items in source */
    totalCount,
    /** Template ref — bind to a sentinel div at the end of the list */
    sentinelRef,
    /** Manually trigger next batch */
    loadMore,
    /** Reset back to first batch (called automatically on source change) */
    reset,
  }
}
