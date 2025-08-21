import type { 
  Project, 
  Asset,
  GenerationJob
} from '@asset-tool/types'
import { useAIConfigStore } from '@/stores/aiConfig'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

class ApiClient {
  private retryDelays = [1000, 2000, 4000] // Exponential backoff
  
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        // Retry on server errors (5xx) but not client errors (4xx)
        if (response.status >= 500 && retryCount < this.retryDelays.length) {
          await this.delay(this.retryDelays[retryCount])
          return this.request<T>(endpoint, options, retryCount + 1)
        }
        
        throw new ApiError(
          errorData.error?.message || 'An error occurred',
          response.status,
          errorData.error?.code,
          errorData.error?.details
        )
      }

      // Handle empty responses (like 204 No Content)
      if (response.status === 204) {
        return undefined as T
      }

      return response.json()
    } catch (error) {
      // Retry on network errors
      if (error instanceof TypeError && error.message.includes('fetch') && retryCount < this.retryDelays.length) {
        await this.delay(this.retryDelays[retryCount])
        return this.request<T>(endpoint, options, retryCount + 1)
      }
      
      if (error instanceof ApiError) {
        throw error
      }
      
      throw new ApiError(
        'Network error occurred',
        0,
        'NETWORK_ERROR'
      )
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Project API methods
  async getProjects(): Promise<Project[]> {
    return this.request<Project[]>('/projects')
  }

  async getProject(id: string): Promise<Project> {
    return this.request<Project>(`/projects/${id}`)
  }

  async createProject(data: any): Promise<Project> {
    return this.request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateProject(
    id: string, 
    data: any
  ): Promise<Project> {
    return this.request<Project>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteProject(id: string): Promise<void> {
    await this.request<void>(`/projects/${id}`, {
      method: 'DELETE',
    })
  }

  async uploadStyleImages(projectId: string, files: File[]): Promise<Project> {
    const formData = new FormData()
    files.forEach(file => formData.append('images', file))

    return this.request<Project>(`/projects/${projectId}/style`, {
      method: 'POST',
      headers: {}, // Remove Content-Type to let browser set it for FormData
      body: formData,
    })
  }

  // Asset API methods
  async getProjectAssets(projectId: string): Promise<Asset[]> {
    return this.request<Asset[]>(`/projects/${projectId}/assets`)
  }

  async getAsset(id: string): Promise<Asset> {
    return this.request<Asset>(`/assets/${id}`)
  }

  async createAsset(
    projectId: string, 
    data: any
  ): Promise<Asset> {
    return this.request<Asset>(`/projects/${projectId}/assets`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async deleteAsset(id: string): Promise<void> {
    await this.request<void>(`/assets/${id}`, {
      method: 'DELETE',
    })
  }

  async downloadAsset(id: string): Promise<Blob> {
    const url = `${API_BASE_URL}/assets/${id}/download`
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new ApiError('Failed to download asset', response.status)
    }
    
    return response.blob()
  }

  // Generation API methods
  async generateImage(data: {
    projectId: string
    name: string
    description?: string
    generationPrompt: string
    generationParameters?: Record<string, any>
    styleOverride?: {
      description?: string
      keywords?: string[]
    }
  }): Promise<{ asset: Asset; job: GenerationJob; message: string }> {
    const aiStore = useAIConfigStore()
    const aiHeaders = aiStore.getApiHeaders('image')
    
    return this.request<{ asset: Asset; job: GenerationJob; message: string }>('/generate/image', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: aiHeaders
    })
  }

  async generateVideo(data: {
    projectId: string
    name: string
    description?: string
    generationPrompt: string
    generationParameters?: Record<string, any>
    styleOverride?: {
      description?: string
      keywords?: string[]
    }
  }): Promise<{ asset: Asset; job: GenerationJob; message: string }> {
    const aiStore = useAIConfigStore()
    const aiHeaders = aiStore.getApiHeaders('video')
    
    return this.request<{ asset: Asset; job: GenerationJob; message: string }>('/generate/video', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: aiHeaders
    })
  }

  async generatePrompt(data: {
    projectId: string
    name: string
    description?: string
    generationPrompt: string
    generationParameters?: Record<string, any>
    styleOverride?: {
      description?: string
      keywords?: string[]
    }
  }): Promise<{ asset: Asset; job: GenerationJob; message: string }> {
    const aiStore = useAIConfigStore()
    const aiHeaders = aiStore.getApiHeaders('prompt')
    
    return this.request<{ asset: Asset; job: GenerationJob; message: string }>('/generate/prompt', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: aiHeaders
    })
  }

  async getGenerationStatus(jobId: string): Promise<{ job: GenerationJob; message: string }> {
    return this.request<{ job: GenerationJob; message: string }>(`/generate/status/${jobId}`)
  }

  async cancelGeneration(jobId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/generate/cancel/${jobId}`, {
      method: 'DELETE',
    })
  }

  // Prompt Management API methods
  async breakdownPrompt(data: {
    prompt: string
    projectId?: string
    assetType?: 'image' | 'video' | 'prompt'
    aiConfig?: {
      provider: string
      model: string
      apiKey: string
    }
  }): Promise<{ breakdown: any }> {
    return this.request<{ breakdown: any }>('/prompts/breakdown', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async generatePromptSuggestions(data: {
    prompt: string
    projectId?: string
    assetType?: 'image' | 'video' | 'prompt'
    aiConfig?: {
      provider: string
      model: string
      apiKey: string
    }
  }): Promise<{ suggestions: any[] }> {
    return this.request<{ suggestions: any[] }>('/prompts/suggestions', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async scorePrompt(data: {
    prompt: string
    projectId?: string
    assetType?: 'image' | 'video' | 'prompt'
    aiConfig?: {
      provider: string
      model: string
      apiKey: string
    }
  }): Promise<{ score: number; feedback: string; suggestions: string[] }> {
    return this.request<{ score: number; feedback: string; suggestions: string[] }>('/prompts/score', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getPromptTemplates(params?: {
    assetType?: 'image' | 'video' | 'prompt'
    category?: string
    tags?: string[]
  }): Promise<{ templates: any[] }> {
    const searchParams = new URLSearchParams()
    if (params?.assetType) searchParams.append('assetType', params.assetType)
    if (params?.category) searchParams.append('category', params.category)
    if (params?.tags) params.tags.forEach(tag => searchParams.append('tags', tag))
    
    const query = searchParams.toString()
    return this.request<{ templates: any[] }>(`/prompts/templates${query ? `?${query}` : ''}`)
  }

  async createPromptTemplate(data: {
    name: string
    description: string
    assetType: 'image' | 'video' | 'prompt'
    category: string
    components: any[]
    examplePrompt: string
    tags: string[]
  }): Promise<{ template: any }> {
    return this.request<{ template: any }>('/prompts/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getPromptHistory(
    projectId: string,
    params?: {
      assetId?: string
      limit?: number
      offset?: number
    }
  ): Promise<{ history: any[]; total: number; hasMore: boolean }> {
    const searchParams = new URLSearchParams()
    if (params?.assetId) searchParams.append('assetId', params.assetId)
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.offset) searchParams.append('offset', params.offset.toString())
    
    const query = searchParams.toString()
    return this.request<{ history: any[]; total: number; hasMore: boolean }>(
      `/prompts/history/${projectId}${query ? `?${query}` : ''}`
    )
  }

  async savePromptHistory(data: {
    projectId: string
    originalPrompt: string
    enhancedPrompt?: string
    assetId?: string
    metadata?: {
      aiProvider?: string
      aiModel?: string
      enhancementType?: 'manual' | 'ai' | 'template'
      score?: number
      feedback?: string
    }
  }): Promise<{ history: any }> {
    return this.request<{ history: any }>('/prompts/history', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }
}

export const apiClient = new ApiClient()
export { ApiError }