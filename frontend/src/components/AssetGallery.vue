<template>
  <div class="bg-white shadow rounded-lg">
    <!-- Header -->
    <div class="px-4 sm:px-6 py-4 border-b border-gray-200">
      <div class="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <h3 class="text-lg font-medium text-gray-900">Project Assets</h3>
        
        <!-- Mobile: Stack controls vertically -->
        <div class="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
          <!-- Create Asset Button -->
          <button
            @click="showAssetCreator = true"
            class="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 touch-manipulation"
          >
            <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Create Asset
          </button>
          
          <!-- Search and Filter Row -->
          <div class="flex space-x-3 sm:space-x-4">
            <!-- Search -->
            <div class="relative flex-1 sm:flex-none sm:w-64">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search assets..."
                class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            
            <!-- Filter -->
            <select
              v-model="selectedType"
              class="block w-32 sm:w-auto pl-3 pr-8 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="">All</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
              <option value="prompt">Prompts</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="p-6">
      <LoadingSpinner 
        size="lg" 
        text="Loading assets..." 
        subtext="Please wait while we fetch your project assets"
        class="justify-center"
      />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="p-6 text-center">
      <svg class="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
      <h3 class="mt-2 text-sm font-semibold text-gray-900">Error loading assets</h3>
      <p class="mt-1 text-sm text-gray-500">{{ error }}</p>
      <button
        @click="fetchAssets"
        class="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Try Again
      </button>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredAssets.length === 0 && !loading" class="p-6 text-center">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <h3 class="mt-2 text-sm font-semibold text-gray-900">No assets found</h3>
      <p class="mt-1 text-sm text-gray-500">
        {{ searchQuery || selectedType ? 'No assets match your filters.' : 'Get started by creating your first asset.' }}
      </p>
    </div>

    <!-- Asset Grid -->
    <div v-else class="p-4 sm:p-6">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        <AssetPreview
          v-for="asset in filteredAssets"
          :key="asset.id"
          :asset="asset"
          @delete="handleDeleteAsset"
          @download="handleDownloadAsset"
        />
      </div>
    </div>

    <!-- Asset Creator Modal -->
    <AssetCreator
      v-if="showAssetCreator && project"
      :project="project"
      @close="showAssetCreator = false"
      @generated="handleAssetGenerated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { Asset, Project, GenerationJob } from '@asset-tool/types'
import { apiClient } from '../services/api'
import { useToast } from '../composables/useToast'
import AssetPreview from './AssetPreview.vue'
import AssetCreator from './AssetCreator.vue'
import LoadingSpinner from './LoadingSpinner.vue'

interface Props {
  projectId: string
  project?: Project
}

const props = defineProps<Props>()

const assets = ref<Asset[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const searchQuery = ref('')
const selectedType = ref<string>('')
const showAssetCreator = ref(false)

const { showSuccess, showError } = useToast()

const filteredAssets = computed(() => {
  let filtered = assets.value

  // Filter by type
  if (selectedType.value) {
    filtered = filtered.filter(asset => asset.type === selectedType.value)
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(asset => 
      asset.name.toLowerCase().includes(query) ||
      (asset.description && asset.description.toLowerCase().includes(query)) ||
      asset.generationPrompt.toLowerCase().includes(query)
    )
  }

  // Sort by creation date (newest first)
  return filtered.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
})

async function fetchAssets() {
  loading.value = true
  error.value = null
  try {
    assets.value = await apiClient.getProjectAssets(props.projectId)
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to fetch assets'
    error.value = errorMessage
    showError('Failed to Load Assets', errorMessage)
  } finally {
    loading.value = false
  }
}

async function handleDeleteAsset(assetId: string) {
  try {
    const asset = assets.value.find(a => a.id === assetId)
    await apiClient.deleteAsset(assetId)
    // Remove from local array
    assets.value = assets.value.filter(asset => asset.id !== assetId)
    showSuccess('Asset Deleted', `"${asset?.name || 'Asset'}" has been deleted successfully.`)
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to delete asset'
    error.value = errorMessage
    showError('Delete Failed', errorMessage)
  }
}

async function handleDownloadAsset(assetId: string) {
  try {
    const asset = assets.value.find(a => a.id === assetId)
    const blob = await apiClient.downloadAsset(assetId)
    
    // Create download link
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = asset?.name || 'asset'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    showSuccess('Download Started', `"${asset?.name || 'Asset'}" download has started.`)
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to download asset'
    error.value = errorMessage
    showError('Download Failed', errorMessage)
  }
}

// Watch for project changes
watch(() => props.projectId, () => {
  fetchAssets()
}, { immediate: false })

onMounted(() => {
  fetchAssets()
})

function handleAssetGenerated(result: { asset: Asset; job: GenerationJob }) {
  // Add the new asset to the list
  assets.value.unshift(result.asset)
  // Close the creator modal
  showAssetCreator.value = false
  // Refresh assets to get the latest data
  fetchAssets()
}

// Expose refresh method for parent components
defineExpose({
  refresh: fetchAssets
})
</script>