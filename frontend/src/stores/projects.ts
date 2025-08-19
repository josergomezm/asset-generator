import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Project } from '@asset-tool/types'
import { apiClient } from '../services/api'
import { useErrorHandler } from '../composables/useErrorHandler'
import { useLoading } from '../composables/useLoading'

export const useProjectStore = defineStore('projects', () => {
  const projects = ref<Project[]>([])
  const currentProject = ref<Project | null>(null)
  const error = ref<string | null>(null)
  const { handleAsyncOperation } = useErrorHandler()
  const { withLoading, isLoading } = useLoading()

  // Computed properties
  const loading = computed(() => isLoading('projects'))
  const projectsById = computed(() => {
    const map = new Map<string, Project>()
    projects.value.forEach(project => map.set(project.id, project))
    return map
  })

  // Actions
  async function fetchProjects() {
    error.value = null
    return withLoading('projects', async () => {
      try {
        const result = await apiClient.getProjects()
        projects.value = result
        return result
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Failed to load projects'
        throw err
      }
    }, 'Loading projects...')
  }

  async function fetchProject(id: string) {
    return withLoading(`project-${id}`, async () => {
      const project = await apiClient.getProject(id)
      currentProject.value = project
      
      // Update in projects list if it exists
      const index = projects.value.findIndex(p => p.id === id)
      if (index !== -1) {
        projects.value[index] = project
      } else {
        projects.value.push(project)
      }
      
      return project
    }, 'Loading project...')
  }

  async function createProject(projectData: any) {
    return withLoading('create-project', async () => {
      const newProject = await apiClient.createProject(projectData)
      projects.value.push(newProject)
      return newProject
    }, 'Creating project...')
  }

  async function updateProject(id: string, projectData: any) {
    return withLoading(`update-project-${id}`, async () => {
      const updatedProject = await apiClient.updateProject(id, projectData)
      
      // Update in projects list
      const index = projects.value.findIndex(p => p.id === id)
      if (index !== -1) {
        projects.value[index] = updatedProject
      }
      
      // Update current project if it's the same
      if (currentProject.value?.id === id) {
        currentProject.value = updatedProject
      }
      
      return updatedProject
    }, 'Updating project...')
  }

  async function deleteProject(id: string) {
    return withLoading(`delete-project-${id}`, async () => {
      await apiClient.deleteProject(id)
      
      // Remove from projects list
      projects.value = projects.value.filter(p => p.id !== id)
      
      // Clear current project if it's the deleted one
      if (currentProject.value?.id === id) {
        currentProject.value = null
      }
    }, 'Deleting project...')
  }

  async function uploadStyleImages(projectId: string, files: File[]) {
    return withLoading(`upload-style-${projectId}`, async (updateProgress) => {
      // Simulate progress for file upload
      updateProgress?.(25, 'Preparing files...')
      
      const updatedProject = await apiClient.uploadStyleImages(projectId, files)
      
      updateProgress?.(75, 'Processing images...')
      
      // Update in projects list
      const index = projects.value.findIndex(p => p.id === projectId)
      if (index !== -1) {
        projects.value[index] = updatedProject
      }
      
      // Update current project if it's the same
      if (currentProject.value?.id === projectId) {
        currentProject.value = updatedProject
      }
      
      updateProgress?.(100, 'Upload complete')
      return updatedProject
    }, 'Uploading style images...')
  }

  // Utility functions
  function getProjectById(id: string): Project | undefined {
    return projectsById.value.get(id)
  }

  function setCurrentProject(project: Project | null) {
    currentProject.value = project
  }

  function clearProjects() {
    projects.value = []
    currentProject.value = null
  }

  return { 
    // State
    projects, 
    currentProject,
    projectsById,
    error,
    
    // Computed
    loading,
    
    // Actions
    fetchProjects, 
    fetchProject,
    createProject, 
    updateProject,
    deleteProject,
    uploadStyleImages,
    
    // Utilities
    getProjectById,
    setCurrentProject,
    clearProjects
  }
})
