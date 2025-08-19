import { ref, computed } from 'vue'

export interface LoadingState {
  isLoading: boolean
  progress?: number
  message?: string
  error?: string
}

export function useLoading() {
  const loadingStates = ref<Map<string, LoadingState>>(new Map())

  const globalLoading = computed(() => {
    return Array.from(loadingStates.value.values()).some(state => state.isLoading)
  })

  const loadingCount = computed(() => {
    return Array.from(loadingStates.value.values()).filter(state => state.isLoading).length
  })

  function setLoading(key: string, loading: boolean, message?: string, progress?: number) {
    const currentState = loadingStates.value.get(key) || { isLoading: false }
    loadingStates.value.set(key, {
      ...currentState,
      isLoading: loading,
      message,
      progress,
      error: loading ? undefined : currentState.error // Clear error when starting new loading
    })
  }

  function setProgress(key: string, progress: number, message?: string) {
    const currentState = loadingStates.value.get(key) || { isLoading: false }
    loadingStates.value.set(key, {
      ...currentState,
      progress,
      message
    })
  }

  function setError(key: string, error: string) {
    const currentState = loadingStates.value.get(key) || { isLoading: false }
    loadingStates.value.set(key, {
      ...currentState,
      isLoading: false,
      error
    })
  }

  function getLoadingState(key: string): LoadingState {
    return loadingStates.value.get(key) || { isLoading: false }
  }

  function isLoading(key: string): boolean {
    return getLoadingState(key).isLoading
  }

  function clearLoading(key: string) {
    loadingStates.value.delete(key)
  }

  function clearAllLoading() {
    loadingStates.value.clear()
  }

  async function withLoading<T>(
    key: string,
    operation: (updateProgress?: (progress: number, message?: string) => void) => Promise<T>,
    initialMessage?: string
  ): Promise<T> {
    setLoading(key, true, initialMessage)
    
    const updateProgress = (progress: number, message?: string) => {
      setProgress(key, progress, message)
    }

    try {
      const result = await operation(updateProgress)
      setLoading(key, false)
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      setError(key, errorMessage)
      throw error
    }
  }

  return {
    loadingStates,
    globalLoading,
    loadingCount,
    setLoading,
    setProgress,
    setError,
    getLoadingState,
    isLoading,
    clearLoading,
    clearAllLoading,
    withLoading
  }
}

// Global loading state for app-wide loading indicators
const globalLoadingState = useLoading()

export function useGlobalLoading() {
  return globalLoadingState
}