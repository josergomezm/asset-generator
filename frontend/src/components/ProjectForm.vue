<template>
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" @click="handleBackdropClick">
    <div class="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium text-gray-900">
            {{ isEditing ? 'Edit Project' : 'Create New Project' }}
          </h3>
          <button
            @click="$emit('close')"
            class="text-gray-400 hover:text-gray-600"
          >
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Project Name -->
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700">
              Project Name *
            </label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              required
              class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              :class="{ 'border-red-300': errors.name }"
              placeholder="Enter project name"
            />
            <p v-if="errors.name" class="mt-1 text-sm text-red-600">{{ errors.name }}</p>
          </div>

          <!-- Project Description -->
          <div>
            <label for="description" class="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              v-model="form.description"
              rows="3"
              class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              :class="{ 'border-red-300': errors.description }"
              placeholder="Describe your project"
            />
            <p v-if="errors.description" class="mt-1 text-sm text-red-600">{{ errors.description }}</p>
          </div>

          <!-- Project Context -->
          <div>
            <label for="context" class="block text-sm font-medium text-gray-700">
              Context
            </label>
            <textarea
              id="context"
              v-model="form.context"
              rows="4"
              class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              :class="{ 'border-red-300': errors.context }"
              placeholder="Provide additional context about your project, target audience, goals, etc."
            />
            <p v-if="errors.context" class="mt-1 text-sm text-red-600">{{ errors.context }}</p>
          </div>

          <!-- Art Style Section -->
          <div class="border-t border-gray-200 pt-6">
            <h4 class="text-md font-medium text-gray-900 mb-4">Art Style Configuration</h4>
            
            <!-- Art Style Description -->
            <div>
              <label for="artStyleDescription" class="block text-sm font-medium text-gray-700">
                Style Description
              </label>
              <textarea
                id="artStyleDescription"
                v-model="form.artStyle.description"
                rows="4"
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                :class="{ 'border-red-300': errors['artStyle.description'] }"
                placeholder="Describe the visual style you want for this project (e.g., 'minimalist flat design with bright colors', 'realistic 3D rendering', etc.)"
              />
              <p v-if="errors['artStyle.description']" class="mt-1 text-sm text-red-600">{{ errors['artStyle.description'] }}</p>
            </div>

            <!-- Style Keywords -->
            <div class="mt-4">
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
          </div>

          <!-- Form Actions -->
          <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              @click="$emit('close')"
              class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="loading"
              class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {{ loading ? 'Saving...' : (isEditing ? 'Update Project' : 'Create Project') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import type { Project } from '@asset-tool/types'
import { z } from 'zod'

// Define schemas locally to avoid build issues
const CreateProjectRequestSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  context: z.string().max(1000),
  artStyle: z.object({
    description: z.string().max(2000),
    referenceImages: z.array(z.string()),
    styleKeywords: z.array(z.string())
  })
})

const UpdateProjectRequestSchema = CreateProjectRequestSchema.partial()

interface Props {
  project?: Project
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  submit: [data: any]
}>()

const isEditing = computed(() => !!props.project)
const loading = ref(false)
const errors = ref<Record<string, string>>({})

const form = reactive({
  name: '',
  description: '',
  context: '',
  artStyle: {
    description: '',
    referenceImages: [] as string[],
    styleKeywords: [] as string[]
  }
})

const keywordsInput = ref('')

// Initialize form with project data if editing
watch(() => props.project, (project) => {
  if (project) {
    form.name = project.name
    form.description = project.description || ''
    form.context = project.context || ''
    form.artStyle.description = project.artStyle?.description || ''
    form.artStyle.referenceImages = project.artStyle?.referenceImages || []
    form.artStyle.styleKeywords = project.artStyle?.styleKeywords || []
    keywordsInput.value = form.artStyle.styleKeywords.join(', ')
  }
}, { immediate: true })

function updateKeywords() {
  form.artStyle.styleKeywords = keywordsInput.value
    .split(',')
    .map(keyword => keyword.trim())
    .filter(keyword => keyword.length > 0)
}

function validateForm() {
  errors.value = {}
  
  try {
    const schema = isEditing.value ? UpdateProjectRequestSchema : CreateProjectRequestSchema
    schema.parse(form)
    return true
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.errors.forEach(err => {
        const path = err.path.join('.')
        errors.value[path] = err.message
      })
    }
    return false
  }
}

async function handleSubmit() {
  if (!validateForm()) {
    return
  }

  loading.value = true
  try {
    emit('submit', { ...form })
  } finally {
    loading.value = false
  }
}

function handleBackdropClick(event: MouseEvent) {
  if (event.target === event.currentTarget) {
    emit('close')
  }
}
</script>