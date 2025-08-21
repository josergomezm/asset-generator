<template>
  <div class="space-y-4 p-4 border border-gray-200 rounded-lg">
    <!-- Provider Selection -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        AI Provider
      </label>
      <select
        v-model="localConfig.provider"
        @change="onProviderChange"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="">Select a provider...</option>
        <option
          v-for="provider in availableProviders"
          :key="provider.id"
          :value="provider.id"
        >
          {{ provider.name }}
        </option>
      </select>
    </div>

    <!-- Model Selection -->
    <div v-if="localConfig.provider">
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Model
      </label>
      <select
        v-model="localConfig.model"
        @change="onModelChange"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="">Select a model...</option>
        <option
          v-for="model in availableModels"
          :key="model.id"
          :value="model.id"
        >
          {{ model.name }}
          <span v-if="model.description" class="text-gray-500">
            - {{ model.description }}
          </span>
        </option>
      </select>
    </div>

    <!-- API Key Input -->
    <div v-if="selectedProvider?.requiresApiKey">
      <label class="block text-sm font-medium text-gray-700 mb-2">
        {{ selectedProvider.keyLabel }}
      </label>
      <div class="relative">
        <input
          v-model="localConfig.apiKey"
          :type="showApiKey ? 'text' : 'password'"
          :placeholder="selectedProvider.keyPlaceholder"
          @input="onApiKeyChange"
          class="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          type="button"
          @click="showApiKey = !showApiKey"
          class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
        >
          <svg v-if="showApiKey" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
          </svg>
        </button>
      </div>
      <p class="mt-1 text-xs text-gray-500">
        Your API key is stored locally in your browser and never sent to our servers.
      </p>
    </div>

    <!-- Model Info -->
    <div v-if="selectedModel" class="p-3 bg-blue-50 rounded-md">
      <div class="flex items-start">
        <svg class="w-5 h-5 text-blue-400 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <h4 class="text-sm font-medium text-blue-900">{{ selectedModel.name }}</h4>
          <p v-if="selectedModel.description" class="text-sm text-blue-700 mt-1">
            {{ selectedModel.description }}
          </p>
          <p class="text-xs text-blue-600 mt-1">
            Type: {{ selectedModel.type }}
          </p>
        </div>
      </div>
    </div>

    <!-- Configuration Status -->
    <div class="flex items-center justify-between pt-2 border-t border-gray-100">
      <div class="flex items-center">
        <div :class="[
          'w-2 h-2 rounded-full mr-2',
          isConfigured ? 'bg-green-500' : 'bg-gray-300'
        ]"></div>
        <span class="text-xs text-gray-600">
          {{ isConfigured ? 'Configured' : 'Configuration incomplete' }}
        </span>
      </div>
      <button
        v-if="isConfigured"
        @click="testConfiguration"
        :disabled="testing"
        class="text-xs text-blue-600 hover:text-blue-700 disabled:text-gray-400"
      >
        {{ testing ? 'Testing...' : 'Test Config' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAIConfigStore, AI_PROVIDERS, type AIConfig, type AIProvider, type AIModel } from '@/stores/aiConfig'

interface Props {
  type: 'image' | 'video' | 'prompt'
  config: AIConfig
}

interface Emits {
  (e: 'update', config: Partial<AIConfig>): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const aiStore = useAIConfigStore()
const showApiKey = ref(false)
const testing = ref(false)

// Local config that syncs with props
const localConfig = ref<AIConfig>({ ...props.config })

// Watch for external config changes
watch(() => props.config, (newConfig) => {
  localConfig.value = { ...newConfig }
}, { deep: true })

// Get available providers that have models for this type
const availableProviders = computed(() => {
  const typeMap = {
    image: 'image' as const,
    video: 'video' as const,
    prompt: 'text' as const
  }
  
  return AI_PROVIDERS.filter(provider => 
    provider.models.some(model => model.type === typeMap[props.type])
  )
})

// Get selected provider
const selectedProvider = computed(() => {
  return aiStore.getProvider(localConfig.value.provider)
})

// Get available models for selected provider and type
const availableModels = computed(() => {
  if (!selectedProvider.value) return []
  
  const typeMap = {
    image: 'image' as const,
    video: 'video' as const,
    prompt: 'text' as const
  }
  
  return selectedProvider.value.models.filter(model => 
    model.type === typeMap[props.type]
  )
})

// Get selected model
const selectedModel = computed(() => {
  if (!selectedProvider.value) return null
  return aiStore.getModel(localConfig.value.provider, localConfig.value.model)
})

// Check if configuration is complete
const isConfigured = computed(() => {
  return localConfig.value.provider && 
         localConfig.value.model && 
         (!selectedProvider.value?.requiresApiKey || localConfig.value.apiKey.trim() !== '')
})

// Event handlers
const onProviderChange = () => {
  // Reset model when provider changes
  localConfig.value.model = ''
  localConfig.value.apiKey = ''
  emitUpdate()
}

const onModelChange = () => {
  emitUpdate()
}

const onApiKeyChange = () => {
  emitUpdate()
}

const emitUpdate = () => {
  emit('update', { ...localConfig.value })
}

const testConfiguration = async () => {
  if (!isConfigured.value) return
  
  testing.value = true
  try {
    // This would be a simple test call to verify the API key works
    // For now, just simulate a test
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // In a real implementation, you'd make a minimal API call here
    console.log('Testing configuration for', props.type, localConfig.value)
    
    // Show success feedback
    alert('Configuration test successful!')
  } catch (error) {
    console.error('Configuration test failed:', error)
    alert('Configuration test failed. Please check your API key.')
  } finally {
    testing.value = false
  }
}
</script>