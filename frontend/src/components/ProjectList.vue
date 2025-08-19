<template>
  <div>
    <!-- Loading State -->
    <div v-if="projectStore.loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p class="mt-2 text-sm text-gray-500">Loading projects...</p>
    </div>



    <!-- Error State -->
    <div v-else-if="projectStore.error" class="text-center py-12">
      <svg class="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
      <h3 class="mt-2 text-sm font-semibold text-gray-900">Error loading projects</h3>
      <p class="mt-1 text-sm text-gray-500">{{ projectStore.error }}</p>
      <button @click="projectStore.fetchProjects()"
        class="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
        Try Again
      </button>
    </div>

    <!-- Empty State -->
    <div v-else-if="projectStore.projects.length === 0" class="text-center py-12">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"
        aria-hidden="true">
        <path vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      </svg>
      <h3 class="mt-2 text-sm font-semibold text-gray-900">No projects</h3>
      <p class="mt-1 text-sm text-gray-500">Get started by creating a new project.</p>
    </div>

    <!-- Projects Grid -->
    <div v-else class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <ProjectCard v-for="project in projectStore.projects" :key="project.id" :project="project"
        @edit="handleEditProject" @delete="handleDeleteProject" />
    </div>

    <!-- Project Form Modal -->
    <ProjectForm v-if="showForm" :project="editingProject" @close="closeForm" @submit="handleFormSubmit" />

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteConfirm" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
      @click="handleDeleteBackdropClick">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="mt-3 text-center">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mt-2">Delete Project</h3>
          <div class="mt-2 px-7 py-3">
            <p class="text-sm text-gray-500">
              Are you sure you want to delete "{{ deletingProject?.name }}"? This action cannot be undone.
            </p>
          </div>
          <div class="flex justify-center space-x-3 mt-4">
            <button @click="cancelDelete"
              class="px-4 py-2 bg-white text-gray-500 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Cancel
            </button>
            <button @click="confirmDelete" :disabled="projectStore.loading"
              class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50">
              {{ projectStore.loading ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Project } from '@asset-tool/types'
import { useProjectStore } from '../stores/projects'
import ProjectCard from './ProjectCard.vue'
import ProjectForm from './ProjectForm.vue'

const projectStore = useProjectStore()

const showForm = ref(false)
const editingProject = ref<Project | undefined>()
const showDeleteConfirm = ref(false)
const deletingProject = ref<Project | undefined>()

onMounted(() => {
  projectStore.fetchProjects()
})

function handleEditProject(project: Project) {
  editingProject.value = project
  showForm.value = true
}

function handleDeleteProject(project: Project) {
  deletingProject.value = project
  showDeleteConfirm.value = true
}

function closeForm() {
  showForm.value = false
  editingProject.value = undefined
}

async function handleFormSubmit(formData: any) {
  try {
    if (editingProject.value) {
      // Update existing project
      await projectStore.updateProject(editingProject.value.id, formData)
    } else {
      // Create new project
      await projectStore.createProject(formData)
    }
    closeForm()
  } catch (error) {
    // Error handling is managed by the store
    console.error('Form submission error:', error)
  }
}

function cancelDelete() {
  showDeleteConfirm.value = false
  deletingProject.value = undefined
}

async function confirmDelete() {
  if (deletingProject.value) {
    try {
      await projectStore.deleteProject(deletingProject.value.id)
      cancelDelete()
    } catch (error) {
      // Error handling is managed by the store
      console.error('Delete error:', error)
    }
  }
}

function handleDeleteBackdropClick(event: MouseEvent) {
  if (event.target === event.currentTarget) {
    cancelDelete()
  }
}

// Expose method to open create form
defineExpose({
  openCreateForm: () => {
    editingProject.value = undefined
    showForm.value = true
  }
})
</script>