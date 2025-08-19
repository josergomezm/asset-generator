import { ref } from 'vue'
import type { ToastOptions } from '../components/ToastContainer.vue'

// Global toast container reference
const toastContainer = ref<{
  addToast: (options: ToastOptions) => string
  removeToast: (id: string) => void
  clearAll: () => void
} | null>(null)

export function useToast() {
  function setToastContainer(container: any) {
    toastContainer.value = container
  }

  function showToast(options: ToastOptions) {
    if (!toastContainer.value) {
      console.warn('Toast container not initialized')
      return
    }
    return toastContainer.value.addToast(options)
  }

  function showSuccess(title: string, message?: string, duration?: number) {
    return showToast({
      type: 'success',
      title,
      message,
      duration
    })
  }

  function showError(title: string, message?: string, persistent = false) {
    return showToast({
      type: 'error',
      title,
      message,
      persistent,
      duration: persistent ? 0 : 8000 // Longer duration for errors
    })
  }

  function showWarning(title: string, message?: string, duration?: number) {
    return showToast({
      type: 'warning',
      title,
      message,
      duration
    })
  }

  function showInfo(title: string, message?: string, duration?: number) {
    return showToast({
      type: 'info',
      title,
      message,
      duration
    })
  }

  function removeToast(id: string) {
    if (!toastContainer.value) {
      console.warn('Toast container not initialized')
      return
    }
    toastContainer.value.removeToast(id)
  }

  function clearAllToasts() {
    if (!toastContainer.value) {
      console.warn('Toast container not initialized')
      return
    }
    toastContainer.value.clearAll()
  }

  return {
    setToastContainer,
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeToast,
    clearAllToasts
  }
}