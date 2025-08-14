<template>
  <div class="bg-white shadow rounded-lg">
    <div class="px-6 py-4 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-medium text-gray-900">Art Style Configuration</h3>
          <p class="mt-1 text-sm text-gray-500">
            Define the visual style for consistent asset generation across your project.
          </p>
        </div>
        <button
          v-if="!isEditing"
          @click="startEditing"
          class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit Style
        </button>
      </div>
    </div>

    <div class="p-6">
      <!-- View Mode -->
      <div v-if="!isEditing">
        <!-- Style Description -->
        <div class="mb-6">
          <h4 class="text-sm font-medium text-gray-900 mb-2">Style Description</h4>
          <div v-if="project.artStyle?.description" class="text-sm text-gray-700 bg-gray-50 rounded-md p-3">
            {{ project.artStyle.description }}
          </div>
          <div v-else class="text-sm text-gray-500 italic">
            No style description provided
          </div>
        </div>

        <!-- Style Keywords -->
        <div class="mb-6">
          <h4 class="text-sm font-medium text-gray-900 mb-2">Style Keywords</h4>
          <div v-if="project.artStyle?.styleKeywords?.length" class="flex flex-wrap gap-2">
            <span
              v-for="keyword in project.artStyle.styleKeywords"
              :key="keyword"
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
            >
              {{ keyword }}
            </span>
          </div>
          <div v-else class="text-sm text-gray-500 italic">
            No style keywords provided
          </div>
        </div>

        <!-- Reference Images -->
        <div>
          <h4 class="text-sm font-medium text-gray-900 mb-2">Reference Images</h4>
          <div v-if="project.artStyle?.referenceImages?.length" class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <div
              v-for="(image, index) in project.artStyle.referenceImages"
              :key="index"
              class="aspect-square rounded-lg overflow-hidden bg-gray-100"
            >
              <img
                :src="getImageUrl(image)"
                :alt="`Reference image ${index + 1}`"
                class="w-full h-full object-cover"
                @error="handleImageError"
              />
            </div>
          </div>
          <div v-else class="text-sm text-gray-500 italic">
            No reference images uploaded
          </div>
        </div>
      </div>

      <!-- Edit Mode -->
      <form v-else @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Style Description -->
        <div>
          <label for="styleDescription" class="block text-sm font-medium text-gray-700">
            Style Description
          </label>
          <textarea
            id="styleDescription"
            v-model="form.description"
            rows="4"
            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            :class="{ 'border-red-300': errors.description }"
            placeholder="Describe the visual style you want for this project (e.g., 'minimalist flat design with bright colors', 'realistic 3D rendering', etc.)"
          />
          <p v-if="errors.description" class="mt-1 text-sm text-red-600">{{ errors.description }}</p>
        </div>

        <!-- Style Keywords -->
        <div>
          <label for="styleKeywords" class="block text-sm font-medium text-gray-700">
            Style Keywords
          </label>
          <input
            id="styleKeywords"
            v-model="keywordsInput"
            type="text"
            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Enter keywords separated by commas (e.g., modern, colorful, geometric)"
            @input="updateKeywords"
          />
          <p class="mt-1 text-xs text-gray-500">
            Separate keywords with commas. These will help maintain consistency across generated assets.
          </p>
        </div>

        <!-- Reference Images Upload -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Reference Images
          </label>
          <FileUpload
            ref="fileUploadRef"
            :multiple="true"
            accept="image/*"
            :max-files="5"
            :max-size="10"
            @files-selected="handleFilesSelected"
            @error="handleUploadError"
          />
          <p class="mt-1 text-xs text-gray-500">
            Upload up to 5 reference images that represent your desired art style.
          </p>
        </div>

        <!-- Form Actions -->
        <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            @click="cancelEditing"
            class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="loading"
            class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {{ loading ? 'Saving...' : 'Save Style' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import type { Project } from '@asset-tool/types'
import { apiClient } from '../services/api'
import FileUpload from './FileUpload.vue'

interface Props {
  project: Project
}

const props = defineProps<Props>()

const emit = defineEmits<{
  updated: [project: Project]
}>()

const isEditing = ref(false)
const loading = ref(false)
const errors = ref<Record<string, string>>({})
const uploadError = ref('')
const selectedFiles = ref<File[]>([])
const fileUploadRef = ref<InstanceType<typeof FileUpload>>()

const form = reactive({
  description: '',
  styleKeywords: [] as string[]
})

const keywordsInput = ref('')

// Initialize form with project data
watch(() => props.project, (project) => {
  form.description = project.artStyle?.description || ''
  form.styleKeywords = project.artStyle?.styleKeywords || []
  keywordsInput.value = form.styleKeywords.join(', ')
}, { immediate: true })

function startEditing() {
  isEditing.value = true
  errors.value = {}
  uploadError.value = ''
  selectedFiles.value = []
}

function cancelEditing() {
  isEditing.value = false
  errors.value = {}
  uploadError.value = ''
  selectedFiles.value = []
  fileUploadRef.value?.clearFiles()
  
  // Reset form to original values
  form.description = props.project.artStyle?.description || ''
  form.styleKeywords = props.project.artStyle?.styleKeywords || []
  keywordsInput.value = form.styleKeywords.join(', ')
}

function updateKeywords() {
  form.styleKeywords = keywordsInput.value
    .split(',')
    .map(keyword => keyword.trim())
    .filter(keyword => keyword.length > 0)
}

function handleFilesSelected(files: File[]) {
  selectedFiles.value = files
  uploadError.value = ''
}

function handleUploadError(message: string) {
  uploadError.value = message
}

function validateForm() {
  errors.value = {}
  
  if (form.description.length > 2000) {
    errors.value.description = 'Description must be less than 2000 characters'
  }
  
  return Object.keys(errors.value).length === 0
}

async function handleSubmit() {
  if (!validateForm()) {
    return
  }

  loading.value = true
  try {
    // First, upload reference images if any
    let updatedProject = props.project
    if (selectedFiles.value.length > 0) {
      updatedProject = await apiClient.uploadStyleImages(props.project.id, selectedFiles.value)
    }

    // Then update the project with style information
    const updateData = {
      artStyle: {
        description: form.description,
        styleKeywords: form.styleKeywords,
        referenceImages: updatedProject.artStyle?.referenceImages || []
      }
    }

    updatedProject = await apiClient.updateProject(props.project.id, updateData)
    
    emit('updated', updatedProject)
    isEditing.value = false
    selectedFiles.value = []
    fileUploadRef.value?.clearFiles()
  } catch (error) {
    console.error('Failed to update style:', error)
    errors.value.general = error instanceof Error ? error.message : 'Failed to update style'
  } finally {
    loading.value = false
  }
}

function getImageUrl(imagePath: string): string {
  // Construct the full URL for the image
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
  return `${baseUrl}/uploads/${imagePath}`
}

function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement
  img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgY2xhc3M9ImZlYXRoZXIgZmVhdGhlci1pbWFnZSI+PHJlY3QgeD0iMyIgeT0iMyIgd2lkdGg9IjE4IiBoZWlnaHQ9IjE4IiByeD0iMiIgcnk9IjIiLz48Y2lyY2xlIGN4PSI4LjUiIGN5PSI4LjUiIHI9IjEuNSIvPjxwb2x5bGluZSBwb2ludHM9IjIxLDE1IDEzLDcgNSwxNSIvPjwvc3ZnPg=='
}
</script>