<template>
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
        Base Prompt *
      </label>
      <textarea
        id="prompt"
        v-model="form.generationPrompt"
        rows="4"
        required
        class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        :class="{ 'border-red-300': errors.generationPrompt }"
        placeholder="Enter a basic prompt that will be enhanced (e.g., 'A futuristic cityscape at night')"
      />
      <p v-if="errors.generationPrompt" class="mt-1 text-sm text-red-600">{{ errors.generationPrompt }}</p>
      <p class="mt-1 text-xs text-gray-500">
        This prompt will be enhanced with your project's art style and additional creative elements.
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
            placeholder="Override the project's art style for this specific prompt"
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
        <h4 class="text-md font-medium text-gray-900">Prompt Parameters (Optional)</h4>
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
          <label for="creativity" class="block text-sm font-medium text-gray-700">
            Creativity Level
          </label>
          <select
            id="creativity"
            v-model="form.generationParameters.creativity"
            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="conservative">Conservative</option>
            <option value="balanced">Balanced</option>
            <option value="creative">Creative</option>
            <option value="experimental">Experimental</option>
          </select>
        </div>

        <div>
          <label for="length" class="block text-sm font-medium text-gray-700">
            Prompt Length
          </label>
          <select
            id="length"
            v-model="form.generationParameters.length"
            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="short">Short (50-100 words)</option>
            <option value="medium">Medium (100-200 words)</option>
            <option value="long">Long (200-300 words)</option>
          </select>
        </div>

        <div>
          <label for="focus" class="block text-sm font-medium text-gray-700">
            Focus Area
          </label>
          <select
            id="focus"
            v-model="form.generationParameters.focus"
            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="visual">Visual Details</option>
            <option value="mood">Mood & Atmosphere</option>
            <option value="technical">Technical Aspects</option>
            <option value="narrative">Narrative Elements</option>
          </select>
        </div>

        <div>
          <label for="variations" class="block text-sm font-medium text-gray-700">
            Generate Variations
          </label>
          <select
            id="variations"
            v-model="form.generationParameters.variations"
            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="1">1 Prompt</option>
            <option value="3">3 Variations</option>
            <option value="5">5 Variations</option>
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
        {{ loading ? 'Starting Generation...' : 'Generate Prompt' }}
      </button>
    </div>
  </form>

  <!-- Generation Status Modal -->
  <div v-if="generationJob" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-60">
    <div class="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
      <div class="mt-3 text-center">
        <h3 class="text-lg font-medium text-gray-900 mb-4">
          Generating Prompt
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
import { z } from 'zod'

interface Props {
  project: Project
}

const props = defineProps<Props>()

const emit = defineEmits<{
  generate: [{ asset: Asset; job: GenerationJob }]
  cancel: []
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
    creativity: 'balanced',
    length: 'medium',
    focus: 'visual',
    variations: 1
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
    errors.value.generationPrompt = 'Base prompt is required'
  } else if (form.generationPrompt.length > 2000) {
    errors.value.generationPrompt = 'Base prompt must be 2000 characters or less'
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

    const result = await apiClient.generatePrompt(requestData)
    
    // Start monitoring generation status
    generationJob.value = result.job
    startStatusPolling()
    
    showInfo('Prompt Generation Started', 'Your enhanced prompt is being generated.')
    
  } catch (error: any) {
    console.error('Failed to start generation:', error)
    if (error.status === 404) {
      errors.value.general = 'Project not found'
      showError('Project Not Found', 'The selected project could not be found.')
    } else {
      errors.value.general = error.message || 'Failed to start generation'
      showError('Generation Failed', error.message || 'Failed to start prompt generation. Please try again.')
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
          showSuccess('Prompt Generated!', 'Your enhanced prompt has been generated successfully.')
          
          // Emit the generation result
          emit('generate', {
            asset: {
              id: generationJob.value.assetId,
              projectId: props.project.id,
              type: 'prompt',
              name: form.name,
              description: form.description,
              generationPrompt: form.generationPrompt,
              generationParameters: form.generationParameters,
              status: 'completed',
              createdAt: new Date().toISOString(),
              metadata: {
                variations: form.generationParameters.variations,
                format: 'txt'
              }
            } as Asset,
            job: generationJob.value
          })
        } else if (generationJob.value.status === 'failed') {
          showError('Generation Failed', generationJob.value.errorMessage || 'Prompt generation failed. Please try again.')
        }
      }
    } catch (error) {
      console.error('Failed to check generation status:', error)
      stopStatusPolling()
    }
  }, 1500) // Check every 1.5 seconds (prompts are faster)
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
      return 'Generating Prompt'
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
      return 'Your prompt generation request is in the queue and will begin shortly...'
    case 'processing':
      return 'Enhancing your prompt with AI and project style guidelines...'
    case 'completed':
      return 'Your enhanced prompt has been generated successfully!'
    case 'failed':
      return generationJob.value.errorMessage || 'Prompt generation failed. Please try again.'
    default:
      return ''
  }
}

// Cleanup on unmount
onUnmounted(() => {
  stopStatusPolling()
})
</script>