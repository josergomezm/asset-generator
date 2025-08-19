import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Asset, GenerationJob } from '@asset-tool/types'
import { apiClient } from '../services/api'
import { useErrorHandler } from '../composables/useErrorHandler'
import { useLoading } from '../composables/useLoading'

export const useAssetStore = defineStore('assets', () => {
  const assets = ref<Asset[]>([])
  const currentAsset = ref<Asset | null>(null)
  const generationJobs = ref<Map<string, GenerationJob>>(new Map())
  const { handleAsyncOperation } = useErrorHandler()
  const { withLoading, isLoading, setProgress } = useLoading()

  // Computed properties
  const loading = computed(() => isLoading('assets'))
  const assetsById = computed(() => {
    const map = new Map<string, Asset>()
    assets.value.forEach(asset => map.set(asset.id, asset))
    return map
  })

  const assetsByProject = computed(() => {
    const map = new Map<string, Asset[]>()
    assets.value.forEach(asset => {
      if (!map.has(asset.projectId)) {
        map.set(asset.projectId, [])
      }
      map.get(asset.projectId)!.push(asset)
    })
    return map
  })

  const activeGenerationJobs = computed(() => {
    return Array.from(generationJobs.value.values()).filter(
      job => job.status === 'queued' || job.status === 'processing'
    )
  })

  // Actions
  async function fetchProjectAssets(projectId: string) {
    return withLoading(`assets-${projectId}`, async () => {
      const result = await apiClient.getProjectAssets(projectId)
      
      // Update assets for this project
      assets.value = assets.value.filter(asset => asset.projectId !== projectId)
      assets.value.push(...result)
      
      return result
    }, 'Loading assets...')
  }

  async function fetchAsset(id: string) {
    return withLoading(`asset-${id}`, async () => {
      const asset = await apiClient.getAsset(id)
      currentAsset.value = asset
      
      // Update in assets list if it exists
      const index = assets.value.findIndex(a => a.id === id)
      if (index !== -1) {
        assets.value[index] = asset
      } else {
        assets.value.push(asset)
      }
      
      return asset
    }, 'Loading asset...')
  }

  async function createAsset(projectId: string, assetData: any) {
    return withLoading(`create-asset-${projectId}`, async () => {
      const newAsset = await apiClient.createAsset(projectId, assetData)
      assets.value.push(newAsset)
      return newAsset
    }, 'Creating asset...')
  }

  async function deleteAsset(id: string) {
    return withLoading(`delete-asset-${id}`, async () => {
      await apiClient.deleteAsset(id)
      
      // Remove from assets list
      assets.value = assets.value.filter(a => a.id !== id)
      
      // Clear current asset if it's the deleted one
      if (currentAsset.value?.id === id) {
        currentAsset.value = null
      }
    }, 'Deleting asset...')
  }

  async function downloadAsset(id: string, filename?: string) {
    return withLoading(`download-asset-${id}`, async (updateProgress) => {
      updateProgress?.(25, 'Preparing download...')
      
      const blob = await apiClient.downloadAsset(id)
      
      updateProgress?.(75, 'Processing file...')
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename || `asset-${id}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      updateProgress?.(100, 'Download complete')
    }, 'Downloading asset...')
  }

  // Generation methods
  async function generateImage(data: any) {
    return withLoading(`generate-image-${data.projectId}`, async (updateProgress) => {
      updateProgress?.(10, 'Starting image generation...')
      
      const result = await apiClient.generateImage(data)
      
      // Add the new asset to the store
      assets.value.push(result.asset)
      
      // Track the generation job
      generationJobs.value.set(result.job.id, result.job)
      
      updateProgress?.(25, 'Generation job created')
      
      // Start polling for job status
      pollGenerationJob(result.job.id)
      
      return result
    }, 'Generating image...')
  }

  async function generateVideo(data: any) {
    return withLoading(`generate-video-${data.projectId}`, async (updateProgress) => {
      updateProgress?.(10, 'Starting video generation...')
      
      const result = await apiClient.generateVideo(data)
      
      // Add the new asset to the store
      assets.value.push(result.asset)
      
      // Track the generation job
      generationJobs.value.set(result.job.id, result.job)
      
      updateProgress?.(25, 'Generation job created')
      
      // Start polling for job status
      pollGenerationJob(result.job.id)
      
      return result
    }, 'Generating video...')
  }

  async function generatePrompt(data: any) {
    return withLoading(`generate-prompt-${data.projectId}`, async (updateProgress) => {
      updateProgress?.(10, 'Starting prompt generation...')
      
      const result = await apiClient.generatePrompt(data)
      
      // Add the new asset to the store
      assets.value.push(result.asset)
      
      // Track the generation job
      generationJobs.value.set(result.job.id, result.job)
      
      updateProgress?.(25, 'Generation job created')
      
      // Start polling for job status
      pollGenerationJob(result.job.id)
      
      return result
    }, 'Generating prompt...')
  }

  // Job polling
  function pollGenerationJob(jobId: string) {
    const pollInterval = setInterval(async () => {
      try {
        const result = await apiClient.getGenerationStatus(jobId)
        const job = result.job
        
        // Update job in store
        generationJobs.value.set(jobId, job)
        
        // Update progress
        setProgress(`poll-job-${jobId}`, job.progress, `Generation ${job.progress}% complete`)
        
        // Update corresponding asset
        const asset = assets.value.find(a => a.id === job.assetId)
        if (asset) {
          asset.status = job.status === 'completed' ? 'completed' : 
                       job.status === 'failed' ? 'failed' : 'generating'
        }
        
        // Stop polling if job is complete
        if (job.status === 'completed' || job.status === 'failed') {
          clearInterval(pollInterval)
          
          // Refresh the asset to get updated data
          if (job.assetId) {
            fetchAsset(job.assetId)
          }
        }
      } catch (error) {
        console.error('Error polling generation job:', error)
        // Continue polling on error, but limit retries
      }
    }, 2000) // Poll every 2 seconds

    // Stop polling after 5 minutes to prevent infinite polling
    setTimeout(() => {
      clearInterval(pollInterval)
    }, 5 * 60 * 1000)
  }

  async function cancelGeneration(jobId: string) {
    return withLoading(`cancel-job-${jobId}`, async () => {
      await apiClient.cancelGeneration(jobId)
      
      // Update job status
      const job = generationJobs.value.get(jobId)
      if (job) {
        job.status = 'failed'
        generationJobs.value.set(jobId, job)
      }
      
      // Update corresponding asset
      const asset = assets.value.find(a => generationJobs.value.get(jobId)?.assetId === a.id)
      if (asset) {
        asset.status = 'failed'
      }
    }, 'Cancelling generation...')
  }

  // Utility functions
  function getAssetById(id: string): Asset | undefined {
    return assetsById.value.get(id)
  }

  function getProjectAssets(projectId: string): Asset[] {
    return assetsByProject.value.get(projectId) || []
  }

  function setCurrentAsset(asset: Asset | null) {
    currentAsset.value = asset
  }

  function clearAssets() {
    assets.value = []
    currentAsset.value = null
    generationJobs.value.clear()
  }

  function clearProjectAssets(projectId: string) {
    assets.value = assets.value.filter(asset => asset.projectId !== projectId)
  }

  return {
    // State
    assets,
    currentAsset,
    generationJobs,
    
    // Computed
    loading,
    assetsById,
    assetsByProject,
    activeGenerationJobs,
    
    // Actions
    fetchProjectAssets,
    fetchAsset,
    createAsset,
    deleteAsset,
    downloadAsset,
    
    // Generation
    generateImage,
    generateVideo,
    generatePrompt,
    cancelGeneration,
    
    // Utilities
    getAssetById,
    getProjectAssets,
    setCurrentAsset,
    clearAssets,
    clearProjectAssets
  }
})