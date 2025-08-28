import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// API configuration
const API_BASE = 'http://localhost:3001/api'

// Helper functions for file-based storage via backend API
async function loadFromAPI<T>(endpoint: string): Promise<T[]> {
  try {
    const response = await fetch(`${API_BASE}/${endpoint}`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.warn(`Error loading ${endpoint}:`, error)
    // Fallback to localStorage if API is not available
    const saved = localStorage.getItem(endpoint)
    if (saved) {
      const data = JSON.parse(saved)
      return Array.isArray(data) ? data : []
    }
    return []
  }
}

async function saveToAPI<T>(endpoint: string, data: T[]): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    // Also save to localStorage as backup
    localStorage.setItem(endpoint, JSON.stringify(data))
  } catch (error) {
    console.error(`Error saving ${endpoint}:`, error)
    // Fallback to localStorage if API is not available
    localStorage.setItem(endpoint, JSON.stringify(data))
  }
}

// Helper to convert date strings back to Date objects
function reviveDates<T extends { createdAt: string | Date }>(items: T[]): T[] {
  return items.map(item => ({
    ...item,
    createdAt: typeof item.createdAt === 'string' ? new Date(item.createdAt) : item.createdAt
  }))
}

export interface Project {
  id: string
  name: string
  description: string
  category: string
  createdAt: Date
}

export interface TokenUsage {
  inputTokens: number
  outputTokens: number
  totalTokens: number
  estimatedCost: number
  timestamp: Date
}

export interface Asset {
  id: string
  projectId: string
  name: string
  type: 'image' | 'text' | 'video' | 'audio'
  context: string
  prompt?: string
  generatedContent?: string
  status: 'draft' | 'generating' | 'completed' | 'error'
  createdAt: Date
  tokenUsage?: TokenUsage[]
  totalTokens?: number
  totalCost?: number
}

export const useProjectsStore = defineStore('projects', () => {
  const projects = ref<Project[]>([])
  const assets = ref<Asset[]>([])
  const currentProject = ref<Project | null>(null)
  const isLoaded = ref(false)

  const getProjectById = computed(() => {
    return (id: string) => projects.value.find(p => p.id === id)
  })

  const getAssetsByProject = computed(() => {
    return (projectId: string) => assets.value.filter(a => a.projectId === projectId)
  })

  async function loadData() {
    if (isLoaded.value) return

    try {
      const projectData = await loadFromAPI<Project>('projects')
      projects.value = reviveDates(projectData)

      const assetData = await loadFromAPI<Asset>('assets')
      assets.value = reviveDates(assetData)

      isLoaded.value = true
    } catch (error) {
      console.error('Error loading data:', error)
      isLoaded.value = true
    }
  }

  async function saveProjects() {
    await saveToAPI('projects', projects.value)
  }

  async function saveAssets() {
    await saveToAPI('assets', assets.value)
  }

  async function addProject(project: Omit<Project, 'id' | 'createdAt'>) {
    const newProject: Project = {
      ...project,
      id: crypto.randomUUID(),
      createdAt: new Date()
    }
    projects.value.push(newProject)
    await saveProjects()
    return newProject
  }

  async function addAsset(asset: Omit<Asset, 'id' | 'createdAt'>) {
    const newAsset: Asset = {
      ...asset,
      id: crypto.randomUUID(),
      createdAt: new Date()
    }
    assets.value.push(newAsset)
    await saveAssets()
    return newAsset
  }

  async function updateAsset(id: string, updates: Partial<Asset>) {
    const index = assets.value.findIndex(a => a.id === id)
    if (index !== -1) {
      assets.value[index] = { ...assets.value[index], ...updates }
      await saveAssets()
    }
  }

  async function updateProject(id: string, updates: Partial<Omit<Project, 'id' | 'createdAt'>>) {
    const index = projects.value.findIndex(p => p.id === id)
    if (index !== -1) {
      projects.value[index] = { ...projects.value[index], ...updates }
      await saveProjects()
    }
  }

  async function deleteProject(id: string) {
    const index = projects.value.findIndex(p => p.id === id)
    if (index !== -1) {
      projects.value.splice(index, 1)
      // Also delete associated assets
      assets.value = assets.value.filter(a => a.projectId !== id)
      await saveProjects()
      await saveAssets()
    }
  }

  async function deleteAsset(id: string) {
    const index = assets.value.findIndex(a => a.id === id)
    if (index !== -1) {
      assets.value.splice(index, 1)
      await saveAssets()
    }
  }

  function setCurrentProject(project: Project | null) {
    currentProject.value = project
  }

  return {
    projects,
    assets,
    currentProject,
    isLoaded,
    getProjectById,
    getAssetsByProject,
    loadData,
    addProject,
    addAsset,
    updateAsset,
    updateProject,
    deleteProject,
    deleteAsset,
    setCurrentProject
  }
})