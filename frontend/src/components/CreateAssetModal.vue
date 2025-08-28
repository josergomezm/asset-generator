<template>
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium text-gray-900">Create New Asset</h3>
          <button
            @click="$emit('close')"
            class="text-gray-400 hover:text-gray-600"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <form @submit.prevent="createAsset" class="space-y-6">
          <div>
            <label for="asset-name" class="block text-sm font-medium text-gray-700">Asset Name</label>
            <input
              id="asset-name"
              v-model="form.name"
              type="text"
              required
              class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="e.g., Hero Banner Image"
            />
          </div>

          <div>
            <label for="asset-type" class="block text-sm font-medium text-gray-700">Asset Type</label>
            <select
              id="asset-type"
              v-model="form.type"
              required
              class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Select asset type</option>
              <option value="image">Image</option>
              <option value="text">Text Content</option>
              <option value="video">Video</option>
              <option value="audio">Audio</option>
            </select>
          </div>

          <div>
            <label for="context" class="block text-sm font-medium text-gray-700">Context & Usage</label>
            <textarea
              id="context"
              v-model="form.context"
              rows="4"
              required
              class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Describe where and how this asset will be used. For example: 'This image will be used as a call-to-action banner on the homepage to encourage visitors to browse our car inventory. It should be eye-catching and professional.'"
            ></textarea>
          </div>

          <div class="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-blue-800">AI-Powered Generation</h3>
                <div class="mt-2 text-sm text-blue-700">
                  <p>Based on your project details and the context you provide, our AI will generate an appropriate prompt for creating this asset. The more specific you are about the intended use, the better the results will be.</p>
                </div>
              </div>
            </div>
          </div>

          <div class="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              @click="$emit('close')"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="!canGenerate"
              class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ canGenerate ? 'Generate Asset' : 'Configure AI Settings First' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue'
import { useProjectsStore, type Project } from '@/stores/projects'
import { useSettingsStore } from '@/stores/settings'
import { generateAssetPrompt } from '@/services/ai'

const props = defineProps<{
  project: Project
}>()

const emit = defineEmits<{
  close: []
  created: []
}>()

const projectsStore = useProjectsStore()
const settingsStore = useSettingsStore()

const form = reactive({
  name: '',
  type: '' as 'image' | 'text' | 'video' | 'audio' | '',
  context: ''
})

const canGenerate = computed(() => {
  return settingsStore.aiSettings.geminiApiKey.length > 0
})

async function createAsset() {
  if (!canGenerate.value) return

  const asset = await projectsStore.addAsset({
    projectId: props.project.id,
    name: form.name,
    type: form.type as any,
    context: form.context,
    status: 'generating'
  })

  emit('created')

  // Generate prompt in background
  try {
    const result = await generateAssetPrompt(props.project, asset, settingsStore.aiSettings)
    
    // Calculate cumulative totals
    const existingTokenUsage = asset.tokenUsage || []
    const newTokenUsage = [...existingTokenUsage, result.tokenUsage]
    const totalTokens = newTokenUsage.reduce((sum, usage) => sum + usage.totalTokens, 0)
    const totalCost = newTokenUsage.reduce((sum, usage) => sum + usage.estimatedCost, 0)
    
    await projectsStore.updateAsset(asset.id, {
      prompt: result.prompt,
      status: 'completed',
      tokenUsage: newTokenUsage,
      totalTokens,
      totalCost
    })
  } catch (error) {
    console.error('Failed to generate prompt:', error)
    await projectsStore.updateAsset(asset.id, {
      status: 'error'
    })
  }
}
</script>