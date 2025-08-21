import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'

export interface AIProvider {
  id: string
  name: string
  models: AIModel[]
  requiresApiKey: boolean
  keyLabel: string
  keyPlaceholder: string
}

export interface AIModel {
  id: string
  name: string
  type: 'image' | 'video' | 'text'
  description?: string
}

export interface AIConfig {
  provider: string
  model: string
  apiKey: string
}

export interface AIConfigByType {
  image: AIConfig
  video: AIConfig
  prompt: AIConfig
}

// Predefined AI providers and their models
export const AI_PROVIDERS: AIProvider[] = [
  {
    id: 'google',
    name: 'Google',
    requiresApiKey: true,
    keyLabel: 'API Key',
    keyPlaceholder: 'AIza...',
    models: [
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', type: 'text', description: 'Fastest and most cost-efficient next-gen model' },
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', type: 'text', description: 'Highly capable multimodal model with a large context window' },
      { id: 'imagen-4-fast', name: 'Imagen 4 Fast', type: 'image', description: 'High-speed, cost-effective image generation model' },
      { id: 'veo-3-fast', name: 'Veo 3 Fast', type: 'video', description: 'Fast and efficient high-quality video generation' }
    ]
  },
  {
    id: 'openai',
    name: 'OpenAI',
    requiresApiKey: true,
    keyLabel: 'API Key',
    keyPlaceholder: 'sk-...',
    models: [
      { id: 'dall-e-3', name: 'DALL-E 3', type: 'image', description: 'Latest image generation model' },
      { id: 'dall-e-2', name: 'DALL-E 2', type: 'image', description: 'Previous generation image model' },
      { id: 'gpt-4', name: 'GPT-4', type: 'text', description: 'Most capable text model' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', type: 'text', description: 'Fast and efficient text model' }
    ]
  },
  {
    id: 'stability',
    name: 'Stability AI',
    requiresApiKey: true,
    keyLabel: 'API Key',
    keyPlaceholder: 'sk-...',
    models: [
      { id: 'stable-diffusion-xl', name: 'Stable Diffusion XL', type: 'image', description: 'High-quality image generation' },
      { id: 'stable-video-diffusion', name: 'Stable Video Diffusion', type: 'video', description: 'Video generation from images' }
    ]
  },
  {
    id: 'replicate',
    name: 'Replicate',
    requiresApiKey: true,
    keyLabel: 'API Token',
    keyPlaceholder: 'r8_...',
    models: [
      { id: 'sdxl', name: 'SDXL', type: 'image', description: 'Stable Diffusion XL via Replicate' },
      { id: 'runway-ml', name: 'RunwayML Gen-2', type: 'video', description: 'Video generation model' }
    ]
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    requiresApiKey: true,
    keyLabel: 'API Key',
    keyPlaceholder: 'sk-ant-...',
    models: [
      { id: 'claude-3-opus', name: 'Claude 3 Opus', type: 'text', description: 'Most capable Claude model' },
      { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', type: 'text', description: 'Balanced performance and speed' }
    ]
  }
]

const STORAGE_KEY = 'ai-config'

export const useAIConfigStore = defineStore('aiConfig', () => {
  // Default configuration
  const defaultConfig: AIConfigByType = {
    image: { provider: 'openai', model: 'dall-e-3', apiKey: '' },
    video: { provider: 'stability', model: 'stable-video-diffusion', apiKey: '' },
    prompt: { provider: 'openai', model: 'gpt-4', apiKey: '' }
  }

  const config = ref<AIConfigByType>({ ...defaultConfig })
  const isConfigured = ref(false)

  // Load configuration from localStorage on initialization
  const loadConfig = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsedConfig = JSON.parse(stored)
        config.value = { ...defaultConfig, ...parsedConfig }
        checkIfConfigured()
      }
    } catch (error) {
      console.warn('Failed to load AI config from localStorage:', error)
    }
  }

  // Save configuration to localStorage
  const saveConfig = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config.value))
      checkIfConfigured()
    } catch (error) {
      console.error('Failed to save AI config to localStorage:', error)
    }
  }

  // Check if at least one configuration has an API key
  const checkIfConfigured = () => {
    isConfigured.value = Object.values(config.value).some(cfg => cfg.apiKey.trim() !== '')
  }

  // Update configuration for a specific asset type
  const updateConfig = (type: keyof AIConfigByType, newConfig: Partial<AIConfig>) => {
    config.value[type] = { ...config.value[type], ...newConfig }
    saveConfig()
  }

  // Get configuration for a specific asset type
  const getConfig = (type: keyof AIConfigByType): AIConfig => {
    return config.value[type]
  }

  // Get provider by ID
  const getProvider = (providerId: string): AIProvider | undefined => {
    return AI_PROVIDERS.find(p => p.id === providerId)
  }

  // Get model by provider and model ID
  const getModel = (providerId: string, modelId: string): AIModel | undefined => {
    const provider = getProvider(providerId)
    return provider?.models.find(m => m.id === modelId)
  }

  // Get available models for a specific type
  const getModelsForType = (type: 'image' | 'video' | 'text'): { provider: AIProvider; model: AIModel }[] => {
    const results: { provider: AIProvider; model: AIModel }[] = []
    
    AI_PROVIDERS.forEach(provider => {
      provider.models
        .filter(model => model.type === type)
        .forEach(model => {
          results.push({ provider, model })
        })
    })
    
    return results
  }

  // Get API headers for a specific asset type
  const getApiHeaders = (type: keyof AIConfigByType): Record<string, string> => {
    const cfg = getConfig(type)
    const provider = getProvider(cfg.provider)
    
    if (!provider || !cfg.apiKey) {
      return {}
    }

    // Return headers based on provider
    switch (provider.id) {
      case 'openai':
        return {
          'X-AI-Provider': 'openai',
          'X-AI-Model': cfg.model,
          'X-AI-API-Key': cfg.apiKey
        }
      case 'stability':
        return {
          'X-AI-Provider': 'stability',
          'X-AI-Model': cfg.model,
          'X-AI-API-Key': cfg.apiKey
        }
      case 'replicate':
        return {
          'X-AI-Provider': 'replicate',
          'X-AI-Model': cfg.model,
          'X-AI-API-Key': cfg.apiKey
        }
      case 'anthropic':
        return {
          'X-AI-Provider': 'anthropic',
          'X-AI-Model': cfg.model,
          'X-AI-API-Key': cfg.apiKey
        }
      default:
        return {}
    }
  }

  // Reset configuration to defaults
  const resetConfig = () => {
    config.value = { ...defaultConfig }
    localStorage.removeItem(STORAGE_KEY)
    isConfigured.value = false
  }

  // Computed properties
  const hasImageConfig = computed(() => config.value.image.apiKey.trim() !== '')
  const hasVideoConfig = computed(() => config.value.video.apiKey.trim() !== '')
  const hasPromptConfig = computed(() => config.value.prompt.apiKey.trim() !== '')

  // Initialize on store creation
  loadConfig()

  return {
    config: readonly(config),
    isConfigured: readonly(isConfigured),
    hasImageConfig,
    hasVideoConfig,
    hasPromptConfig,
    updateConfig,
    getConfig,
    getProvider,
    getModel,
    getModelsForType,
    getApiHeaders,
    resetConfig,
    loadConfig,
    saveConfig
  }
})