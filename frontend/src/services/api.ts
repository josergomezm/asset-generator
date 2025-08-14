import type { 
  Project, 
  Asset
} from '@asset-tool/types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new ApiError(
        errorData.error?.message || 'An error occurred',
        response.status,
        errorData.error?.code
      )
    }

    return response.json()
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
}

export const apiClient = new ApiClient()
export { ApiError }