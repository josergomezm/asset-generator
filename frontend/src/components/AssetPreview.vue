<template>
  <div class="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 touch-manipulation">
    <!-- Asset Preview -->
    <div class="aspect-w-16 aspect-h-9 bg-gray-100 rounded-t-lg overflow-hidden">
      <!-- Image Preview -->
      <div v-if="asset.type === 'image'" class="w-full h-40 sm:h-48 bg-gray-100 flex items-center justify-center">
        <img
          v-if="asset.filePath"
          :src="getAssetPreviewUrl(asset.id)"
          :alt="asset.name"
          class="w-full h-full object-cover cursor-pointer"
          @error="handleImageError"
          @click="showDetails = true"
        />
        <div v-else class="text-center">
          <svg class="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p class="mt-2 text-xs sm:text-sm text-gray-500">No preview</p>
        </div>
      </div>

      <!-- Video Preview -->
      <div v-else-if="asset.type === 'video'" class="w-full h-40 sm:h-48 bg-gray-100 flex items-center justify-center">
        <video
          v-if="asset.filePath"
          :src="getAssetPreviewUrl(asset.id)"
          class="w-full h-full object-cover"
          controls
          preload="metadata"
          playsinline
        />
        <div v-else class="text-center">
          <svg class="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <p class="mt-2 text-xs sm:text-sm text-gray-500">No preview</p>
        </div>
      </div>

      <!-- Prompt Preview -->
      <div v-else-if="asset.type === 'prompt'" class="w-full h-40 sm:h-48 bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-3 sm:p-4 cursor-pointer" @click="showDetails = true">
        <div class="text-center">
          <svg class="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p class="mt-2 text-xs sm:text-sm text-purple-600 font-medium">Text Prompt</p>
        </div>
      </div>
    </div>

    <!-- Asset Info -->
    <div class="p-3 sm:p-4">
      <div class="flex items-start justify-between">
        <div class="flex-1 min-w-0">
          <h4 class="text-sm font-medium text-gray-900 truncate">{{ asset.name }}</h4>
          <p v-if="asset.description" class="mt-1 text-xs sm:text-sm text-gray-500 line-clamp-2">
            {{ asset.description }}
          </p>
          <div class="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              {{ asset.type }}
            </span>
            <span class="hidden sm:inline">{{ formatDate(asset.createdAt) }}</span>
            <span class="sm:hidden">{{ formatDateShort(asset.createdAt) }}</span>
            <span v-if="asset.status" :class="getStatusClass(asset.status)">
              {{ asset.status }}
            </span>
          </div>
        </div>

        <!-- Actions Menu -->
        <div class="ml-2 flex-shrink-0 relative">
          <button
            @click="showMenu = !showMenu"
            class="inline-flex items-center p-2 sm:p-1 border border-transparent rounded-full shadow-sm text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 touch-manipulation"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>

          <!-- Dropdown Menu -->
          <div
            v-if="showMenu"
            v-click-outside="() => showMenu = false"
            class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
          >
            <div class="py-1">
              <button
                v-if="asset.filePath"
                @click="handleDownload"
                class="w-full text-left px-4 py-3 sm:py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center touch-manipulation"
              >
                <svg class="mr-3 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download
              </button>
              <button
                @click="showDetails = true"
                class="w-full text-left px-4 py-3 sm:py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center touch-manipulation"
              >
                <svg class="mr-3 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                View Details
              </button>
              <button
                @click="confirmDelete = true"
                class="w-full text-left px-4 py-3 sm:py-2 text-sm text-red-700 hover:bg-red-50 flex items-center touch-manipulation"
              >
                <svg class="mr-3 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Asset Details Modal -->
    <div
      v-if="showDetails"
      class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 p-4"
      @click="showDetails = false"
    >
      <div
        class="relative top-4 sm:top-20 mx-auto p-4 sm:p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto"
        @click.stop
      >
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium text-gray-900">Asset Details</h3>
          <button
            @click="showDetails = false"
            class="text-gray-400 hover:text-gray-600"
          >
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Name</label>
            <p class="mt-1 text-sm text-gray-900">{{ asset.name }}</p>
          </div>
          
          <div v-if="asset.description">
            <label class="block text-sm font-medium text-gray-700">Description</label>
            <p class="mt-1 text-sm text-gray-900">{{ asset.description }}</p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700">Generation Prompt</label>
            <p class="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{{ asset.generationPrompt }}</p>
          </div>
          
          <div v-if="asset.styleOverride && (asset.styleOverride.description || asset.styleOverride.keywords?.length)">
            <label class="block text-sm font-medium text-gray-700">Style Override Used</label>
            <div class="mt-1 bg-orange-50 border border-orange-200 rounded-md p-3">
              <div v-if="asset.styleOverride.description" class="mb-2">
                <p class="text-sm font-medium text-orange-900">Custom Style:</p>
                <p class="text-sm text-orange-800">{{ asset.styleOverride.description }}</p>
              </div>
              <div v-if="asset.styleOverride.keywords?.length" class="flex flex-wrap gap-1">
                <span class="text-xs font-medium text-orange-900">Keywords:</span>
                <span
                  v-for="keyword in asset.styleOverride.keywords"
                  :key="keyword"
                  class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800"
                >
                  {{ keyword }}
                </span>
              </div>
            </div>
          </div>
          
          <div v-if="Object.keys(asset.generationParameters).length > 0">
            <label class="block text-sm font-medium text-gray-700">Generation Parameters</label>
            <pre class="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md overflow-x-auto">{{ JSON.stringify(asset.generationParameters, null, 2) }}</pre>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Type</label>
              <p class="mt-1 text-sm text-gray-900">{{ asset.type }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Status</label>
              <p class="mt-1 text-sm text-gray-900">{{ asset.status }}</p>
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700">Created</label>
            <p class="mt-1 text-sm text-gray-900">{{ formatDate(asset.createdAt) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="confirmDelete"
      class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 p-4"
      @click="confirmDelete = false"
    >
      <div
        class="relative top-20 mx-auto p-4 sm:p-5 border w-full max-w-sm shadow-lg rounded-md bg-white"
        @click.stop
      >
        <div class="mt-3 text-center">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mt-2">Delete Asset</h3>
          <div class="mt-2 px-7 py-3">
            <p class="text-sm text-gray-500">
              Are you sure you want to delete "{{ asset.name }}"? This action cannot be undone.
            </p>
          </div>
          <div class="flex justify-center space-x-4 mt-4">
            <button
              @click="confirmDelete = false"
              class="px-4 py-3 sm:py-2 bg-white text-gray-500 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 touch-manipulation"
            >
              Cancel
            </button>
            <button
              @click="handleDelete"
              class="px-4 py-3 sm:py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 touch-manipulation"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Asset } from '@asset-tool/types'

interface Props {
  asset: Asset
}

const props = defineProps<Props>()

const emit = defineEmits<{
  delete: [assetId: string]
  download: [assetId: string]
}>()

const showMenu = ref(false)
const showDetails = ref(false)
const confirmDelete = ref(false)

function getAssetPreviewUrl(assetId: string): string {
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
  return `${API_BASE_URL}/assets/${assetId}/download`
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatDateShort(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}

function getStatusClass(status: string): string {
  const baseClasses = 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium'
  
  switch (status) {
    case 'completed':
      return `${baseClasses} bg-green-100 text-green-800`
    case 'generating':
      return `${baseClasses} bg-yellow-100 text-yellow-800`
    case 'failed':
      return `${baseClasses} bg-red-100 text-red-800`
    case 'pending':
    default:
      return `${baseClasses} bg-gray-100 text-gray-800`
  }
}

function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
}

function handleDownload() {
  showMenu.value = false
  emit('download', props.asset.id)
}

function handleDelete() {
  confirmDelete.value = false
  showMenu.value = false
  emit('delete', props.asset.id)
}

// Click outside directive
const vClickOutside = {
  mounted(el: HTMLElement & { clickOutsideEvent?: (event: Event) => void }, binding: any) {
    el.clickOutsideEvent = function(event: Event) {
      if (!(el === event.target || el.contains(event.target as Node))) {
        binding.value()
      }
    }
    document.addEventListener('click', el.clickOutsideEvent)
  },
  unmounted(el: HTMLElement & { clickOutsideEvent?: (event: Event) => void }) {
    if (el.clickOutsideEvent) {
      document.removeEventListener('click', el.clickOutsideEvent)
    }
  }
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>