<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <h1 class="text-2xl font-bold text-gray-900">Assets Creator</h1>
          <router-link
            to="/settings"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Settings
          </router-link>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-semibold text-gray-900">Your Projects</h2>
          <button
            @click="showCreateProject = true"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
            New Project
          </button>
        </div>

        <div v-if="projects.length === 0" class="text-center py-12">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">No projects</h3>
          <p class="mt-1 text-sm text-gray-500">Get started by creating a new project.</p>
        </div>

        <div v-else class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="project in projects"
            :key="project.id"
            @click="selectProject(project)"
            class="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-md transition-shadow"
          >
            <div class="p-6">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div
                    class="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold"
                  >
                    {{ project.name.charAt(0).toUpperCase() }}
                  </div>
                </div>
                <div class="ml-4 flex-1">
                  <h3 class="text-lg font-medium text-gray-900">{{ project.name }}</h3>
                  <p class="text-sm text-gray-500">{{ project.category }}</p>
                </div>
              </div>
              <p class="mt-4 text-sm text-gray-600">{{ project.description }}</p>
              <div class="mt-4 flex items-center text-xs text-gray-500">
                <span>{{ formatDate(project.createdAt) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Create Project Modal -->
    <CreateProjectModal
      v-if="showCreateProject"
      @close="showCreateProject = false"
      @created="onProjectCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectsStore, type Project } from '@/stores/projects'
import CreateProjectModal from '@/components/CreateProjectModal.vue'

const router = useRouter()
const projectsStore = useProjectsStore()
const showCreateProject = ref(false)

const projects = computed(() => projectsStore.projects)

onMounted(async () => {
  await projectsStore.loadData()
})

function selectProject(project: Project) {
  projectsStore.setCurrentProject(project)
  router.push(`/project/${project.id}`)
}

function onProjectCreated() {
  showCreateProject.value = false
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date)
}
</script>