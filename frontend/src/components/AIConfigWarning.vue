<template>
  <div v-if="!aiStore.isConfigured" class="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
    <div class="flex items-start">
      <svg class="w-5 h-5 text-yellow-400 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
      <div class="flex-1">
        <h3 class="text-sm font-medium text-yellow-800">AI Configuration Required</h3>
        <p class="mt-1 text-sm text-yellow-700">
          To generate assets with AI, you need to configure your AI providers and API keys. 
          Without configuration, generation will use simulation mode.
        </p>
        <div class="mt-3">
          <button
            @click="$emit('aiConfig')"
            class="text-sm font-medium text-yellow-800 hover:text-yellow-900 underline"
          >
            Configure AI Settings
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAIConfigStore } from '@/stores/aiConfig'

defineEmits<{
  aiConfig: []
}>()

const aiStore = useAIConfigStore()
</script>