<template>
  <div>
    <div class="mb-6">
      <router-link 
        to="/" 
        class="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
      >
        <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Projects
      </router-link>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p class="mt-2 text-sm text-gray-500">Loading project...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-12">
      <svg class="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
      <h3 class="mt-2 text-sm font-semibold text-gray-900">Error loading project</h3>
      <p class="mt-1 text-sm text-gray-500">{{ error }}</p>
      <button
        @click="fetchProject"
        class="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Try Again
      </button>
    </div>

    <!-- Project Content -->
    <div v-else-if="project">
      <!-- Project Header -->
      <div class="sm:flex sm:items-center mb-8">
        <div class="sm:flex-auto">
          <h1 class="text-2xl font-semibold leading-6 text-gray-900">{{ project.name }}</h1>
          <p v-if="project.description" class="mt-2 text-sm text-gray-700">
            {{ project.description }}
          </p>
          <p v-if="project.context" class="mt-1 text-sm text-gray-500">
            {{ project.context }}
          </p>
        </div>
      </div>

      <!-- Art Style Configuration -->
      <div class="mb-8">
        <StyleDefinition 
          :project="project" 
          @updated="handleProjectUpdated"
        />
      </div>

      <!-- Asset Gallery will be implemented in later tasks -->
      <div class="mt-8">
        <div class="bg-white shadow rounded-lg p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Project Assets</h3>
          <p class="text-gray-500">Asset gallery - to be implemented in later tasks</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Project } from '@asset-tool/types'
import { apiClient } from '../services/api'
import StyleDefinition from '../components/StyleDefinition.vue'

interface Props {
  id: string
}

const props = defineProps<Props>()

const project = ref<Project | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

async function fetchProject() {
  loading.value = true
  error.value = null
  try {
    project.value = await apiClient.getProject(props.id)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to fetch project'
  } finally {
    loading.value = false
  }
}

function handleProjectUpdated(updatedProject: Project) {
  project.value = updatedProject
}

onMounted(() => {
  fetchProject()
})
</script>