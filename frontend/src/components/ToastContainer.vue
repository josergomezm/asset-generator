<template>
  <div
    aria-live="assertive"
    class="fixed inset-0 flex items-end justify-center px-4 py-6 pointer-events-none sm:p-6 sm:items-start sm:justify-end z-50"
  >
    <div class="w-full flex flex-col items-center space-y-4 sm:items-end">
      <Toast
        v-for="toast in toasts"
        :key="toast.id"
        :type="toast.type"
        :title="toast.title"
        :message="toast.message"
        :duration="toast.duration"
        :persistent="toast.persistent"
        @close="removeToast(toast.id)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Toast from './Toast.vue'

export interface ToastOptions {
  id?: string
  type?: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  persistent?: boolean
}

interface ToastItem extends Required<Omit<ToastOptions, 'id'>> {
  id: string
}

const toasts = ref<ToastItem[]>([])

function addToast(options: ToastOptions) {
  const toast: ToastItem = {
    id: options.id || generateId(),
    type: options.type || 'info',
    title: options.title,
    message: options.message || '',
    duration: options.duration ?? 5000,
    persistent: options.persistent || false
  }
  
  toasts.value.push(toast)
  
  return toast.id
}

function removeToast(id: string) {
  const index = toasts.value.findIndex(toast => toast.id === id)
  if (index > -1) {
    toasts.value.splice(index, 1)
  }
}

function clearAll() {
  toasts.value = []
}

function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

// Expose methods for parent components
defineExpose({
  addToast,
  removeToast,
  clearAll
})
</script>