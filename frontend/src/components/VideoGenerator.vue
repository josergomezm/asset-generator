<template>
  <!-- AI Configuration Warning -->
  <AIConfigWarning @open-config="$emit('aiConfig')" />
  
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <!-- Asset Name -->
    <div>
      <label for="name" class="block text-sm font-medium text-gray-700">
        Asset Name *
      </label>
      <input
        id="name"
        v-model="form.name"
        type="text"
        required
        class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        :class="{ 'border-red-300': errors.name }"
        placeholder="Enter asset name"
      />
      <p v-if="errors.name" class="mt-1 text-sm text-red-600">{{ errors.name }}</p>
    </div>

    <!-- Asset Description -->
    <div>
      <label for="description" class="block text-sm font-medium text-gray-700">
        Description
      </label>
      <textarea
        id="description"
        v-model="form.description"
        rows="2"
        class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        :class="{ 'border-red-300': errors.description }"
        placeholder="Describe what you want to generate"
      />
      <p v-if="errors.description" class="mt-1 text-sm text-red-600">{{ errors.description }}</p>
    </div>

    <!-- Generation Prompt -->
    <div>
      <label for="prompt" class="block text-sm font-medium text-gray-700">
        Generation Prompt *
      </label>
      <textarea
        id="prompt"
        v-model="form.generationPrompt"
        rows="4"
        required
        class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        :class="{ 'border-red-300': errors.generationPrompt }"
        placeholder="Describe the video you want to generate (e.g., 'A time-lapse of a sunrise over mountains')"
      />
      <p v-if="errors.generationPrompt" class="mt-1 text-sm text-red-600">{{ errors.generationPrompt }}</p>
      <p class="mt-1 text-xs text-gray-500">
        This prompt will be enhanced with your project's art style automatically.
      </p>
    </div>

    <!-- Style Preview -->
    <div v-if="project.artStyle?.description" class="bg-blue-50 border border-blue-200 rounded-md p-4">
      <h4 class="text-sm font-medium text-blue-900 mb-2">Project Art Style</h4>
      <p class="text-sm text-blue-800">{{ project.artStyle.description }}</p>
      <div v-if="project.artStyle.styleKeywords?.length" class="mt-2">
        <div class="flex flex-wrap gap-1">
          <span
            v-for="keyword in project.artStyle.styleKeywords"
            :key="keyword"
            class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
          >
            {{ keyword }}
          </span>
        </div>
      </div>
    </div>

    <!-- Style Override Section -->
    <div class="border-t border-gray-200 pt-6">
      <div class="flex items-center justify-between mb-4">
        <h4 class="text-md font-medium text-gray-900">Style Override (Optional)</h4>
        <button
          type="button"
          @click="showStyleOverride = !showStyleOverride"
          class="text-sm text-blue-600 hover:text-blue-500"
        >
          {{ showStyleOverride ? 'Hide' : 'Show' }} Override Options
        </button>
      </div>
      
      <div v-if="showStyleOverride" class="space-y-4">
        <div>
          <label for="styleOverrideDescription" class="block text-sm font-medium text-gray-700">
            Override Style Description
          </label>
          <textarea
            id="styleOverrideDescription"
            v-model="form.styleOverride.description"
            rows="3"
            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Override the project's art style for this specific asset"
          />
          <p class="mt-1 text-xs text-gray-500">
            Leave empty to use the project's default art style.
          </p>
        </div>

        <div>
          <label for="styleOverrideKeywords" class="block text-sm font-medium text-gray-700">
            Override Keywords
          </label>
          <input
            id="styleOverrideKeywords"
            v-model="overrideKeywordsInput"
            type="text"
            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Enter keywords separated by commas"
            @input="updateOverrideKeywords"
          />
        </div>
      </div>
    </div>

    <!-- Generation Parameters -->
    <div class="border-t border-gray-200 pt-6">
      <div class="flex items-center justify-between mb-4">
        <h4 class="text-md font-medium text-gray-900">Video Parameters (Optional)</h4>
        <button
          type="button"
          @click="showAdvanced = !showAdvanced"
          class="text-sm text-blue-600 hover:text-blue-500"
        >
          {{ showAdvanced ? 'Hide' : 'Show' }} Advanced
        </button>
      </div>
      
      <div v-if="showAdvanced" class="grid grid-cols-2 gap-4">
        <div>
          <label for="duration" class="block text-sm font-medium text-gray-700">
            Duration (seconds)
          </label>
          <select
            id="duration"
            v-model="form.generationParameters.duration"
            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="3">3 seconds</option>
            <option value="5">5 seconds</option>
            <option value="10">10 seconds</option>
            <option value="15">15 seconds</option>
            <option value="30">30 seconds</option>
          </select>
        </div>

        <div>
          <label for="fps" class="block text-sm font-medium text-gray-700">
            Frame Rate (FPS)
          </label>
          <select
            id="fps"
            v-model="form.generationParameters.fps"
            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="24">24 FPS</option>
            <option value="30">30 FPS</option>
            <option value="60">60 FPS</option>
          </select>
        </div>

        <div>
          <label for="resolution" class="block text-sm font-medium text-gray-700">
            Resolution
          </label>
          <select
            id="resolution"
            v-model="form.generationParameters.resolution"
            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="720p">720p (1280x720)</option>
            <option value="1080p">1080p (1920x1080)</option>
            <option value="4k">4K (3840x2160)</option>
          </select>
        </div>

        <div>
          <label for="motion" class="block text-sm font-medium text-gray-700">
            Motion Intensity
          </label>
          <select
            id="motion"
            v-model="form.generationParameters.motion_intensity"
            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Form Actions -->
    <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200">
      <button
        type="button"
        @click="$emit('cancel')"
        class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Cancel
      </button>
      <button
        type="submit"
        :disabled="loading"
        class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center"
      >
        <LoadingSpinner v-if="loading" size="sm" color="gray" class="mr-2" />
        {{ loading ? 'Starting Generation...' : 'Generate Video' }}
      </button>
    </div>
  </form>

  <!-- Generation Status Modal -->
  <div v-if="generationJob" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-60">
    <div class="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
      <div class="mt-3 text-center">
        <h3 class="text-lg font-medium text-gray-900 mb-4">
          Generating Video
        </h3>
        
        <!-- Progress Indicator -->
        <ProgressIndicator
          :progress="generationJob.progress"
          :label="getProgressLabel()"
          :message="getStatusMessage()"
          :variant="generationJob.status === 'failed' ? 'error' : 'default'"
          :animated="generationJob.status === 'processing'"
        />
        
        <div v-if="generationJob.status === 'failed'" class="text-red-600 text-sm mb-4">
          {{ generationJob.errorMessage || 'Generation failed' }}
        </div>
        
        <div class="flex justify-center space-x-3">
          <button
            v-if="generationJob.status === 'queued' || generationJob.status === 'processing'"
            @click="cancelGeneration"
            class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            v-if="generationJob.status === 'completed' || generationJob.status === 'failed'"
            @click="closeGenerationStatus"
            class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onUnmounted } from 'vue'
import type { Project, Asset, GenerationJob } from '@asset-tool/types'
import { apiClient } from '../services/api'
import { useToast } from '../composables/useToast'
import LoadingSpinner from './LoadingSpinner.vue'
import ProgressIndicator from './ProgressIndicator.vue'
import AIConfigWarning from './AIConfigWarning.vue'

interface Props {
  project: Project
}

const props = defineProps<Props>()

const emit = defineEmits<{
  generate: [{ asset: Asset; job: GenerationJob }]
  cancel: []
  aiConfig: []
}>()

const loading = ref(false)
const errors = ref<Record<string, string>>({})
const showStyleOverride = ref(false)
const showAdvanced = ref(false)
const generationJob = ref<GenerationJob | null>(null)
const statusCheckInterval = ref<number | null>(null)

const { showSuccess, showError, showInfo } = useToast()

const form = reactive({
  name: '',
  description: '',
  generationPrompt: '',
  generationParameters: {
    duration: 5,
    fps: 30,
    resolution: '1080p',
    motion_intensity: 'medium'
  },
  styleOverride: {
    description: '',
    keywords: [] as string[]
  }
})

const overrideKeywordsInput = ref('')

function updateOverrideKeywords() {
  form.styleOverride.keywords = overrideKeywordsInput.value
    .split(',')
    .map(keyword => keyword.trim())
    .filter(keyword => keyword.length > 0)
}

function validateForm() {
  errors.value = {}
  
  if (!form.name.trim()) {
    errors.value.name = 'Asset name is required'
  } else if (form.name.length > 100) {
    errors.value.name = 'Asset name must be 100 characters or less'
  }
  
  if (form.description && form.description.length > 500) {
    errors.value.description = 'Description must be 500 characters or less'
  }
  
  if (!form.generationPrompt.trim()) {
    errors.value.generationPrompt = 'Generation prompt is required'
  } else if (form.generationPrompt.length > 2000) {
    errors.value.generationPrompt = 'Generation prompt must be 2000 characters or less'
  }
  
  return Object.keys(errors.value).length === 0
}

async function handleSubmit() {
  if (!validateForm()) {
    return
  }

  loading.value = true
  try {
    const requestData = {
      projectId: props.project.id,
      name: form.name,
      description: form.description || undefined,
      generationPrompt: form.generationPrompt,
      generationParameters: form.generationParameters,
      styleOverride: (form.styleOverride.description || form.styleOverride.keywords.length > 0) 
        ? {
            description: form.styleOverride.description || undefined,
            keywords: form.styleOverride.keywords.length > 0 ? form.styleOverride.keywords : undefined
          }
        : undefined
    }

    const result = await apiClient.generateVideo(requestData)
    
    // Start monitoring generation status
    generationJob.value = result.job
    startStatusPolling()
    
    showInfo('Video Generation Started', 'Your video generation has been queued. This may take several minutes.')
    
  } catch (error: any) {
    console.error('Failed to start generation:', error)
    if (error.status === 404) {
      errors.value.general = 'Project not found'
      showError('Project Not Found', 'The selected project could not be found.')
    } else {
      errors.value.general = error.message || 'Failed to start generation'
      showError('Generation Failed', error.message || 'Failed to start video generation. Please try again.')
    }
  } finally {
    loading.value = false
  }
}

function startStatusPolling() {
  if (!generationJob.value) return
  
  statusCheckInterval.value = window.setInterval(async () => {
    if (!generationJob.value) return
    
    try {
      const response = await apiClient.getGenerationStatus(generationJob.value.id)
      generationJob.value = response.job
      
      // Stop polling if generation is complete or failed
      if (generationJob.value.status === 'completed' || generationJob.value.status === 'failed') {
        stopStatusPolling()
        
        if (generationJob.value.status === 'completed') {
          showSuccess('Video Generated!', 'Your video has been generated successfully.')
          
          // Emit the generation result
          emit('generate', {
            asset: {
              id: generationJob.value.assetId,
              projectId: props.project.id,
              type: 'video',
              name: form.name,
              description: form.description,
              generationPrompt: form.generationPrompt,
              generationParameters: form.generationParameters,
              status: 'completed',
              createdAt: new Date().toISOString(),
              metadata: {
                duration: form.generationParameters.duration,
                format: 'mp4'
              }
            } as Asset,
            job: generationJob.value
          })
        } else if (generationJob.value.status === 'failed') {
          showError('Generation Failed', generationJob.value.errorMessage || 'Video generation failed. Please try again.')
        }
      }
    } catch (error) {
      console.error('Failed to check generation status:', error)
      stopStatusPolling()
    }
  }, 3000) // Check every 3 seconds (videos take longer)
}

function stopStatusPolling() {
  if (statusCheckInterval.value) {
    clearInterval(statusCheckInterval.value)
    statusCheckInterval.value = null
  }
}

async function cancelGeneration() {
  if (!generationJob.value) return
  
  try {
    await apiClient.cancelGeneration(generationJob.value.id)
    stopStatusPolling()
    generationJob.value = null
  } catch (error) {
    console.error('Failed to cancel generation:', error)
  }
}

function closeGenerationStatus() {
  stopStatusPolling()
  generationJob.value = null
}

function getProgressLabel(): string {
  if (!generationJob.value) return 'Progress'
  
  switch (generationJob.value.status) {
    case 'queued':
      return 'Queued'
    case 'processing':
      return 'Generating Video'
    case 'completed':
      return 'Completed'
    case 'failed':
      return 'Failed'
    default:
      return 'Progress'
  }
}

function getStatusMessage(): string {
  if (!generationJob.value) return ''
  
  switch (generationJob.value.status) {
    case 'queued':
      return 'Your video generation request is in the queue and will begin shortly...'
    case 'processing':
      return 'Creating your video with AI. This process may take several minutes...'
    case 'completed':
      return 'Your video has been generated successfully!'
    case 'failed':
      return generationJob.value.errorMessage || 'Video generation failed. Please try again.'
    default:
      return ''
  }
}

// Cleanup on unmount
onUnmounted(() => {
  stopStatusPolling()
})
</script>