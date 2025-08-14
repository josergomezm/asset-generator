import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Project } from '@asset-tool/types'
import { apiClient } from '../services/api'

export const useProjectStore = defineStore('projects', () => {
  const projects = ref<Project[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchProjects() {
    loading.value = true
    error.value = null
    try {
      projects.value = await apiClient.getProjects()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch projects'
    } finally {
      loading.value = false
    }
  }

  async function createProject(projectData: any) {
    loading.value = true
    error.value = null
    try {
      const newProject = await apiClient.createProject(projectData)
      projects.value.push(newProject)
      return newProject
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create project'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateProject(id: string, projectData: any) {
    loading.value = true
    error.value = null
    try {
      const updatedProject = await apiClient.updateProject(id, projectData)
      const index = projects.value.findIndex(p => p.id === id)
      if (index !== -1) {
        projects.value[index] = updatedProject
      }
      return updatedProject
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update project'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteProject(id: string) {
    loading.value = true
    error.value = null
    try {
      await apiClient.deleteProject(id)
      projects.value = projects.value.filter(p => p.id !== id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete project'
      throw err
    } finally {
      loading.value = false
    }
  }

  return { 
    projects, 
    loading, 
    error, 
    fetchProjects, 
    createProject, 
    updateProject,
    deleteProject 
  }
})
