<template>
  <div class="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200">
    <div class="p-6">
      <div class="flex items-center justify-between">
        <div class="flex-1 min-w-0">
          <h3 class="text-lg font-medium text-gray-900 truncate">
            {{ project.name }}
          </h3>
          <p class="mt-1 text-sm text-gray-500 line-clamp-2">
            {{ project.description }}
          </p>
        </div>
        <div class="ml-4 flex-shrink-0">
          <div class="flex space-x-2">
            <button
              @click="$emit('edit', project)"
              class="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              title="Edit project"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              @click="$emit('delete', project)"
              class="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              title="Delete project"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div class="mt-4">
        <div class="flex items-center justify-between text-sm text-gray-500">
          <span>{{ formatDate(project.createdAt) }}</span>
          <router-link
            :to="`/projects/${project.id}`"
            class="font-medium text-blue-600 hover:text-blue-500"
          >
            View details →
          </router-link>
        </div>
      </div>

      <!-- Art Style Preview -->
      <div v-if="project.artStyle?.description" class="mt-4 pt-4 border-t border-gray-200">
        <div class="flex items-center space-x-2">
          <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
          </svg>
          <span class="text-xs text-gray-500 truncate">{{ project.artStyle.description }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Project } from '@asset-tool/types'

interface Props {
  project: Project
}

defineProps<Props>()

defineEmits<{
  edit: [project: Project]
  delete: [project: Project]
}>()

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>