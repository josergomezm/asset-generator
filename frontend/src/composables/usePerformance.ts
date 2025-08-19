import { ref, computed, watch, nextTick } from 'vue'

export interface PaginationOptions {
  page: number
  limit: number
  total: number
}

export interface VirtualScrollOptions {
  itemHeight: number
  containerHeight: number
  buffer: number
}

export function usePagination(initialLimit = 20) {
  const currentPage = ref(1)
  const itemsPerPage = ref(initialLimit)
  const totalItems = ref(0)

  const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value))
  const hasNextPage = computed(() => currentPage.value < totalPages.value)
  const hasPreviousPage = computed(() => currentPage.value > 1)
  
  const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage.value)
  const endIndex = computed(() => Math.min(startIndex.value + itemsPerPage.value, totalItems.value))

  function goToPage(page: number) {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
    }
  }

  function nextPage() {
    if (hasNextPage.value) {
      currentPage.value++
    }
  }

  function previousPage() {
    if (hasPreviousPage.value) {
      currentPage.value--
    }
  }

  function setTotal(total: number) {
    totalItems.value = total
    // Reset to first page if current page is out of bounds
    if (currentPage.value > totalPages.value && totalPages.value > 0) {
      currentPage.value = 1
    }
  }

  function reset() {
    currentPage.value = 1
    totalItems.value = 0
  }

  return {
    currentPage,
    itemsPerPage,
    totalItems,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    startIndex,
    endIndex,
    goToPage,
    nextPage,
    previousPage,
    setTotal,
    reset
  }
}

export function useVirtualScroll<T>(
  items: T[],
  options: VirtualScrollOptions
) {
  const scrollTop = ref(0)
  const containerRef = ref<HTMLElement>()

  const visibleItemsCount = computed(() => 
    Math.ceil(options.containerHeight / options.itemHeight) + options.buffer * 2
  )

  const startIndex = computed(() => 
    Math.max(0, Math.floor(scrollTop.value / options.itemHeight) - options.buffer)
  )

  const endIndex = computed(() => 
    Math.min(items.length, startIndex.value + visibleItemsCount.value)
  )

  const visibleItems = computed(() => 
    items.slice(startIndex.value, endIndex.value).map((item, index) => ({
      item,
      index: startIndex.value + index,
      top: (startIndex.value + index) * options.itemHeight
    }))
  )

  const totalHeight = computed(() => items.length * options.itemHeight)
  const offsetY = computed(() => startIndex.value * options.itemHeight)

  function handleScroll(event: Event) {
    const target = event.target as HTMLElement
    scrollTop.value = target.scrollTop
  }

  function scrollToIndex(index: number) {
    if (containerRef.value) {
      const targetScrollTop = index * options.itemHeight
      containerRef.value.scrollTop = targetScrollTop
    }
  }

  return {
    containerRef,
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    scrollToIndex
  }
}

export function useDebounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

export function useThrottle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0

  return (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastCall >= delay) {
      lastCall = now
      fn(...args)
    }
  }
}

export function useLazyLoading() {
  const loadedItems = ref(new Set<string>())
  const loadingItems = ref(new Set<string>())

  function isLoaded(id: string): boolean {
    return loadedItems.value.has(id)
  }

  function isLoading(id: string): boolean {
    return loadingItems.value.has(id)
  }

  function setLoading(id: string) {
    loadingItems.value.add(id)
  }

  function setLoaded(id: string) {
    loadingItems.value.delete(id)
    loadedItems.value.add(id)
  }

  function reset() {
    loadedItems.value.clear()
    loadingItems.value.clear()
  }

  return {
    isLoaded,
    isLoading,
    setLoading,
    setLoaded,
    reset
  }
}

export function useIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
) {
  const observer = ref<IntersectionObserver>()
  const isSupported = 'IntersectionObserver' in window

  function observe(element: Element) {
    if (!isSupported) return

    if (!observer.value) {
      observer.value = new IntersectionObserver(callback, options)
    }

    observer.value.observe(element)
  }

  function unobserve(element: Element) {
    if (observer.value) {
      observer.value.unobserve(element)
    }
  }

  function disconnect() {
    if (observer.value) {
      observer.value.disconnect()
      observer.value = undefined
    }
  }

  return {
    isSupported,
    observe,
    unobserve,
    disconnect
  }
}