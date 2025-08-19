import type { 
  Project, 
  Asset,
  GenerationJob
} from '@asset-tool/types'

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
    return this.request<{ asset: Asset; job: GenerationJob; message: string }>('/generate/image', {
      method: 'POST',
      body: JSON.stringify(data),
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
    return this.request<{ asset: Asset; job: GenerationJob; message: string }>('/generate/video', {
      method: 'POST',
      body: JSON.stringify(data),
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
    return this.request<{ asset: Asset; job: GenerationJob; message: string }>('/generate/prompt', {
      method: 'POST',
      body: JSON.stringify(data),
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
}

export const apiClient = new ApiClient()
export { ApiError }