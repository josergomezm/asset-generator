<template>
  <!-- AI Configuration Warning -->
  <AIConfigWarning @open-config="$emit('aiConfig')" />
  
  <!-- Prompt Templates Section -->
  <div v-if="showTemplates" class="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-medium text-gray-900">Prompt Templates</h3>
      <button
        type="button"
        @click="showTemplates = false"
        class="text-sm text-gray-500 hover:text-gray-700"
      >
        Hide Templates
      </button>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div
        v-for="template in promptTemplates"
        :key="template.id"
        @click="applyTemplate(template)"
        class="p-3 border border-gray-200 rounded-md cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors"
      >
        <h4 class="font-medium text-gray-900">{{ template.name }}</h4>
        <p class="text-sm text-gray-600 mt-1">{{ template.description }}</p>
        <div class="flex flex-wrap gap-1 mt-2">
          <span
            v-for="tag in template.tags.slice(0, 3)"
            :key="tag"
            class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
          >
            {{ tag }}
          </span>
        </div>
      </div>
    </div>
  </div>
  
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
      <div class="flex items-center justify-between mb-2">
        <label for="prompt" class="block text-sm font-medium text-gray-700">
          Base Prompt *
        </label>
        <div class="flex space-x-2">
          <button
            type="button"
            @click="showTemplates = !showTemplates"
            class="text-xs text-blue-600 hover:text-blue-500"
          >
            {{ showTemplates ? 'Hide' : 'Show' }} Templates
          </button>
          <button
            type="button"
            @click="analyzePrompt"
            :disabled="!form.generationPrompt.trim() || analyzingPrompt"
            class="text-xs text-blue-600 hover:text-blue-500 disabled:text-gray-400"
          >
            {{ analyzingPrompt ? 'Analyzing...' : 'Analyze Prompt' }}
          </button>
        </div>
      </div>
      <textarea
        id="prompt"
        v-model="form.generationPrompt"
        rows="4"
        required
        class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        :class="{ 'border-red-300': errors.generationPrompt }"
        placeholder="Enter a basic prompt that will be enhanced (e.g., 'A futuristic cityscape at night')"
        @input="onPromptChange"
      />
      <p v-if="errors.generationPrompt" class="mt-1 text-sm text-red-600">{{ errors.generationPrompt }}</p>
      <p class="mt-1 text-xs text-gray-500">
        This prompt will be enhanced with your project's art style and additional creative elements.
      </p>
      
      <!-- Prompt Score -->
      <div v-if="promptScore" class="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-gray-700">Prompt Quality Score</span>
          <span class="text-sm font-bold" :class="getScoreColor(promptScore.score)">
            {{ promptScore.score }}/100
          </span>
        </div>
        <p class="text-sm text-gray-600">{{ promptScore.feedback }}</p>
      </div>
    </div>

    <!-- Prompt Breakdown -->
    <div v-if="promptBreakdown" class="bg-blue-50 border border-blue-200 rounded-md p-4">
      <h4 class="text-sm font-medium text-blue-900 mb-3">Prompt Components</h4>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div
          v-for="component in promptBreakdown.components"
          :key="component.id"
          class="bg-white border border-blue-200 rounded-md p-3"
        >
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs font-medium text-blue-800 uppercase">{{ component.type }}</span>
            <span class="text-xs text-blue-600">Weight: {{ component.weight || 5 }}/10</span>
          </div>
          <p class="text-sm font-medium text-gray-900">{{ component.label }}</p>
          <p class="text-sm text-gray-700">{{ component.value }}</p>
          <p v-if="component.description" class="text-xs text-gray-500 mt-1">{{ component.description }}</p>
        </div>
      </div>
    </div>

    <!-- Prompt Suggestions -->
    <div v-if="promptSuggestions.length > 0" class="bg-yellow-50 border border-yellow-200 rounded-md p-4">
      <h4 class="text-sm font-medium text-yellow-900 mb-3">Suggestions for Improvement</h4>
      <div class="space-y-3">
        <div
          v-for="suggestion in promptSuggestions"
          :key="suggestion.id"
          class="bg-white border border-yellow-200 rounded-md p-3"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center space-x-2 mb-1">
                <span class="text-xs font-medium text-yellow-800 uppercase">{{ suggestion.type }}</span>
                <span class="text-xs text-yellow-600">{{ Math.round(suggestion.confidence * 100) }}% confidence</span>
              </div>
              <p class="text-sm font-medium text-gray-900">{{ suggestion.title }}</p>
              <p class="text-sm text-gray-700">{{ suggestion.description }}</p>
              <p class="text-sm text-blue-600 mt-1 font-medium">{{ suggestion.suggestedChange }}</p>
              <p v-if="suggestion.reasoning" class="text-xs text-gray-500 mt-1">{{ suggestion.reasoning }}</p>
            </div>
            <button
              type="button"
              @click="applySuggestion(suggestion)"
              class="ml-3 text-xs text-blue-600 hover:text-blue-500 font-medium"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
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
import { ref, reactive, onMounted, onUnmounted } from 'vue'
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
const showTemplates = ref(false)
const generationJob = ref<GenerationJob | null>(null)
const statusCheckInterval = ref<number | null>(null)

// New Google AI features
const analyzingPrompt = ref(false)
const promptBreakdown = ref<any>(null)
const promptSuggestions = ref<any[]>([])
const promptScore = ref<any>(null)
const promptTemplates = ref<any[]>([])
const promptHistory = ref<any[]>([])
const debounceTimeout = ref<number | null>(null)

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

// New Google AI methods
async function loadPromptTemplates() {
  try {
    const response = await apiClient.getPromptTemplates({
      assetType: 'prompt'
    })
    promptTemplates.value = response.templates
  } catch (error) {
    console.error('Failed to load prompt templates:', error)
  }
}

function applyTemplate(template: any) {
  form.generationPrompt = template.examplePrompt
  showTemplates.value = false
  
  // Clear previous analysis
  promptBreakdown.value = null
  promptSuggestions.value = []
  promptScore.value = null
  
  showInfo('Template Applied', `Applied "${template.name}" template to your prompt.`)
}

async function analyzePrompt() {
  if (!form.generationPrompt.trim()) return
  
  analyzingPrompt.value = true
  try {
    // Get AI config from store (assuming it exists)
    const aiConfig = {
      provider: 'google',
      model: 'gemini-pro',
      apiKey: 'demo-key' // This should come from the AI config store
    }
    
    // Breakdown prompt
    const breakdownResponse = await apiClient.breakdownPrompt({
      prompt: form.generationPrompt,
      projectId: props.project.id,
      assetType: 'prompt',
      aiConfig
    })
    promptBreakdown.value = breakdownResponse.breakdown
    
    // Generate suggestions
    const suggestionsResponse = await apiClient.generatePromptSuggestions({
      prompt: form.generationPrompt,
      projectId: props.project.id,
      assetType: 'prompt',
      aiConfig
    })
    promptSuggestions.value = suggestionsResponse.suggestions
    
    // Score prompt
    const scoreResponse = await apiClient.scorePrompt({
      prompt: form.generationPrompt,
      projectId: props.project.id,
      assetType: 'prompt',
      aiConfig
    })
    promptScore.value = scoreResponse
    
    showSuccess('Prompt Analyzed', 'Your prompt has been analyzed with AI insights.')
    
  } catch (error: any) {
    console.error('Failed to analyze prompt:', error)
    showError('Analysis Failed', 'Failed to analyze prompt. Please try again.')
  } finally {
    analyzingPrompt.value = false
  }
}

function onPromptChange() {
  // Clear previous analysis when prompt changes
  promptBreakdown.value = null
  promptSuggestions.value = []
  promptScore.value = null
  
  // Debounce auto-analysis
  if (debounceTimeout.value) {
    clearTimeout(debounceTimeout.value)
  }
  
  debounceTimeout.value = window.setTimeout(() => {
    if (form.generationPrompt.trim().length > 20) {
      // Auto-analyze for longer prompts
      analyzePrompt()
    }
  }, 2000)
}

function applySuggestion(suggestion: any) {
  // Simple implementation - append the suggested change
  if (suggestion.suggestedChange) {
    if (form.generationPrompt.trim()) {
      form.generationPrompt += ', ' + suggestion.suggestedChange
    } else {
      form.generationPrompt = suggestion.suggestedChange
    }
    
    // Remove the applied suggestion
    promptSuggestions.value = promptSuggestions.value.filter(s => s.id !== suggestion.id)
    
    showInfo('Suggestion Applied', `Applied: ${suggestion.title}`)
  }
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-yellow-600'
  return 'text-red-600'
}

async function loadPromptHistory() {
  try {
    const response = await apiClient.getPromptHistory(props.project.id)
    promptHistory.value = response.history
  } catch (error) {
    console.error('Failed to load prompt history:', error)
  }
}

async function savePromptToHistory(originalPrompt: string, enhancedPrompt?: string) {
  try {
    await apiClient.savePromptHistory({
      projectId: props.project.id,
      originalPrompt,
      enhancedPrompt,
      metadata: {
        enhancementType: 'ai',
        aiProvider: 'google',
        aiModel: 'gemini-pro'
      }
    })
  } catch (error) {
    console.error('Failed to save prompt history:', error)
  }
}

// Load templates on mount
onMounted(() => {
  loadPromptTemplates()
  loadPromptHistory()
})

// Cleanup on unmount
onUnmounted(() => {
  stopStatusPolling()
  if (debounceTimeout.value) {
    clearTimeout(debounceTimeout.value)
  }
})
</script>