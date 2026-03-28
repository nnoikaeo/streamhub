import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, nextTick } from 'vue'
import { useLazyLoad } from '../../app/composables/useLazyLoad'

// ---- Mock IntersectionObserver ----
let observerCallback: IntersectionObserverCallback
let observedElements: Element[] = []

class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | null = null
  readonly rootMargin: string = ''
  readonly thresholds: ReadonlyArray<number> = []
  constructor(callback: IntersectionObserverCallback, _options?: IntersectionObserverInit) {
    observerCallback = callback
  }
  observe(el: Element) { observedElements.push(el) }
  unobserve(el: Element) { observedElements = observedElements.filter((e) => e !== el) }
  disconnect() { observedElements = [] }
  takeRecords(): IntersectionObserverEntry[] { return [] }
}

/** Simulate the sentinel scrolling into view */
function triggerIntersect() {
  if (!observerCallback || observedElements.length === 0) return
  observerCallback(
    [{ isIntersecting: true } as IntersectionObserverEntry],
    {} as IntersectionObserver,
  )
}

// ---- Mock requestAnimationFrame ----
function flushRAF() {
  vi.runAllTimers()
}

// ---- Helpers ----
function makeItems(count: number) {
  return Array.from({ length: count }, (_, i) => ({ id: i + 1 }))
}

// ---- Setup / Teardown ----
beforeEach(() => {
  observedElements = []
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    return setTimeout(() => cb(performance.now()), 0)
  })
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

// ==================================================================
// Tests
// ==================================================================

describe('useLazyLoad', () => {
  // ---------- Initial State ----------

  it('shows only the first batch initially (batchSize=12)', () => {
    const items = ref(makeItems(30))
    const { visibleItems, hasMore, totalCount } = useLazyLoad(items, { batchSize: 12 })

    expect(visibleItems.value).toHaveLength(12)
    expect(hasMore.value).toBe(true)
    expect(totalCount.value).toBe(30)
  })

  it('shows all items when total < batchSize', () => {
    const items = ref(makeItems(5))
    const { visibleItems, hasMore } = useLazyLoad(items, { batchSize: 12 })

    expect(visibleItems.value).toHaveLength(5)
    expect(hasMore.value).toBe(false)
  })

  it('uses default batchSize of 12', () => {
    const items = ref(makeItems(20))
    const { visibleItems } = useLazyLoad(items)

    expect(visibleItems.value).toHaveLength(12)
  })

  it('handles empty items', () => {
    const items = ref<{ id: number }[]>([])
    const { visibleItems, hasMore, totalCount } = useLazyLoad(items, { batchSize: 12 })

    expect(visibleItems.value).toHaveLength(0)
    expect(hasMore.value).toBe(false)
    expect(totalCount.value).toBe(0)
  })

  // ---------- loadMore ----------

  it('loadMore appends next batch', () => {
    const items = ref(makeItems(30))
    const { visibleItems, loadMore, hasMore } = useLazyLoad(items, { batchSize: 12 })

    loadMore()
    flushRAF()

    expect(visibleItems.value).toHaveLength(24)
    expect(hasMore.value).toBe(true)
  })

  it('loadMore caps at total items', () => {
    const items = ref(makeItems(20))
    const { visibleItems, loadMore, hasMore } = useLazyLoad(items, { batchSize: 12 })

    loadMore()
    flushRAF()

    expect(visibleItems.value).toHaveLength(20)
    expect(hasMore.value).toBe(false)
  })

  it('loadMore does nothing when hasMore is false', () => {
    const items = ref(makeItems(5))
    const { visibleItems, loadMore } = useLazyLoad(items, { batchSize: 12 })

    loadMore()
    flushRAF()

    expect(visibleItems.value).toHaveLength(5)
  })

  it('multiple loadMore calls progressively show more items', () => {
    const items = ref(makeItems(50))
    const { visibleItems, loadMore, hasMore } = useLazyLoad(items, { batchSize: 10 })

    expect(visibleItems.value).toHaveLength(10)

    loadMore(); flushRAF()
    expect(visibleItems.value).toHaveLength(20)

    loadMore(); flushRAF()
    expect(visibleItems.value).toHaveLength(30)

    loadMore(); flushRAF()
    expect(visibleItems.value).toHaveLength(40)

    loadMore(); flushRAF()
    expect(visibleItems.value).toHaveLength(50)
    expect(hasMore.value).toBe(false)
  })

  // ---------- Reset on source change ----------

  it('resets to first batch when source items change', async () => {
    const items = ref(makeItems(30))
    const { visibleItems, loadMore } = useLazyLoad(items, { batchSize: 12 })

    loadMore()
    flushRAF()
    expect(visibleItems.value).toHaveLength(24)

    // Simulate a filter change — replace the entire array
    items.value = makeItems(8)
    await nextTick()

    expect(visibleItems.value).toHaveLength(8)
  })

  it('resets when items become empty', async () => {
    const items = ref(makeItems(30))
    const { visibleItems, loadMore, hasMore } = useLazyLoad(items, { batchSize: 12 })

    loadMore()
    flushRAF()
    expect(visibleItems.value).toHaveLength(24)

    items.value = []
    await nextTick()

    expect(visibleItems.value).toHaveLength(0)
    expect(hasMore.value).toBe(false)
  })

  // ---------- IntersectionObserver integration ----------

  it('observes sentinel when sentinelRef is set', async () => {
    const items = ref(makeItems(30))
    const { sentinelRef } = useLazyLoad(items, { batchSize: 12 })

    const el = { nodeType: 1 } as unknown as HTMLElement
    sentinelRef.value = el
    await nextTick()

    expect(observedElements).toHaveLength(1)
  })

  it('loads next batch when sentinel intersects', async () => {
    const items = ref(makeItems(30))
    const { visibleItems, sentinelRef } = useLazyLoad(items, { batchSize: 12 })

    sentinelRef.value = { nodeType: 1 } as unknown as HTMLElement
    await nextTick()

    triggerIntersect()
    flushRAF()

    expect(visibleItems.value).toHaveLength(24)
  })

  it('disconnects observer when sentinel is removed', async () => {
    const items = ref(makeItems(30))
    const { sentinelRef } = useLazyLoad(items, { batchSize: 12 })

    sentinelRef.value = { nodeType: 1 } as unknown as HTMLElement
    await nextTick()
    expect(observedElements).toHaveLength(1)

    sentinelRef.value = null
    await nextTick()
    expect(observedElements).toHaveLength(0)
  })

  // ---------- Custom batchSize ----------

  it('respects custom batchSize', () => {
    const items = ref(makeItems(100))
    const { visibleItems, loadMore } = useLazyLoad(items, { batchSize: 25 })

    expect(visibleItems.value).toHaveLength(25)

    loadMore()
    flushRAF()
    expect(visibleItems.value).toHaveLength(50)
  })

  // ---------- Grouped view (small batch) ----------

  it('works with small batchSize for grouped view', () => {
    const groups = ref(makeItems(15))
    const { visibleItems, hasMore, loadMore } = useLazyLoad(groups, { batchSize: 4 })

    expect(visibleItems.value).toHaveLength(4)
    expect(hasMore.value).toBe(true)

    loadMore(); flushRAF()
    expect(visibleItems.value).toHaveLength(8)

    loadMore(); flushRAF()
    expect(visibleItems.value).toHaveLength(12)

    loadMore(); flushRAF()
    expect(visibleItems.value).toHaveLength(15)
    expect(hasMore.value).toBe(false)
  })

  // ---------- Correct slice contents ----------

  it('visibleItems contains correct items in order', () => {
    const items = ref(makeItems(30))
    const { visibleItems, loadMore } = useLazyLoad(items, { batchSize: 5 })

    expect(visibleItems.value.map((i) => i.id)).toEqual([1, 2, 3, 4, 5])

    loadMore(); flushRAF()
    expect(visibleItems.value.map((i) => i.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  })
})
