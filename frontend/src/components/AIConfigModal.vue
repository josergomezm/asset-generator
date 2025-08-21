<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b">
        <h2 class="text-xl font-semibold text-gray-900">AI Configuration</h2>
        <button
          @click="closeModal"
          class="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
        <div class="space-y-8">
          <!-- Image Generation Config -->
          <div class="space-y-4">
            <h3 class="text-lg font-medium text-gray-900 flex items-center">
              <svg class="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Image Generation
            </h3>
            <AIConfigSection
              type="image"
              :config="aiStore.getConfig('image')"
              @update="(newConfig: Partial<AIConfig>) => aiStore.updateConfig('image', newConfig)"
            />
          </div>

          <!-- Video Generation Config -->
          <div class="space-y-4">
            <h3 class="text-lg font-medium text-gray-900 flex items-center">
              <svg class="w-5 h-5 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Video Generation
            </h3>
            <AIConfigSection
              type="video"
              :config="aiStore.getConfig('video')"
              @update="(newConfig: Partial<AIConfig>) => aiStore.updateConfig('video', newConfig)"
            />
          </div>

          <!-- Prompt Generation Config -->
          <div class="space-y-4">
            <h3 class="text-lg font-medium text-gray-900 flex items-center">
              <svg class="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Prompt Enhancement
            </h3>
            <AIConfigSection
              type="prompt"
              :config="aiStore.getConfig('prompt')"
              @update="(newConfig: Partial<AIConfig>) => aiStore.updateConfig('prompt', newConfig)"
            />
          </div>
        </div>

        <!-- Configuration Status -->
        <div class="mt-8 p-4 bg-gray-50 rounded-lg">
          <h4 class="text-sm font-medium text-gray-900 mb-2">Configuration Status</h4>
          <div class="space-y-2">
            <div class="flex items-center">
              <div :class="[
                'w-3 h-3 rounded-full mr-2',
                aiStore.hasImageConfig ? 'bg-green-500' : 'bg-gray-300'
              ]"></div>
              <span class="text-sm text-gray-600">
                Image Generation: {{ aiStore.hasImageConfig ? 'Configured' : 'Not configured' }}
              </span>
            </div>
            <div class="flex items-center">
              <div :class="[
                'w-3 h-3 rounded-full mr-2',
                aiStore.hasVideoConfig ? 'bg-green-500' : 'bg-gray-300'
              ]"></div>
              <span class="text-sm text-gray-600">
                Video Generation: {{ aiStore.hasVideoConfig ? 'Configured' : 'Not configured' }}
              </span>
            </div>
            <div class="flex items-center">
              <div :class="[
                'w-3 h-3 rounded-full mr-2',
                aiStore.hasPromptConfig ? 'bg-green-500' : 'bg-gray-300'
              ]"></div>
              <span class="text-sm text-gray-600">
                Prompt Enhancement: {{ aiStore.hasPromptConfig ? 'Configured' : 'Not configured' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-between p-2 border-t bg-gray-50">
        <button
          @click="resetConfiguration"
          class="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
        >
          Reset All
        </button>
        <div class="flex space-x-3">
          <button
            @click="closeModal"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            @click="saveAndClose"
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAIConfigStore, type AIConfig } from '@/stores/aiConfig'
import AIConfigSection from '@/components/AIConfigSection.vue'

interface Props {
  isOpen: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'save'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const aiStore = useAIConfigStore()

const closeModal = () => {
  emit('close')
}

const saveAndClose = () => {
  aiStore.saveConfig()
  emit('save')
  emit('close')
}

const resetConfiguration = () => {
  if (confirm('Are you sure you want to reset all AI configurations? This will remove all API keys.')) {
    aiStore.resetConfig()
  }
}
</script>