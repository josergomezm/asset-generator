<template>
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" @click="handleBackdropClick">
    <div class="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium text-gray-900">
            Create New Asset
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

        <!-- Asset Type Selection -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-3">
            Asset Type
          </label>
          <div class="grid grid-cols-3 gap-4">
            <button
              @click="selectedType = 'image'"
              :class="[
                'p-4 border-2 rounded-lg text-center transition-colors',
                selectedType === 'image' 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-300 hover:border-gray-400'
              ]"
            >
              <svg class="h-8 w-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div class="font-medium">Image</div>
              <div class="text-xs text-gray-500">Generate images</div>
            </button>
            
            <button
              @click="selectedType = 'video'"
              :class="[
                'p-4 border-2 rounded-lg text-center transition-colors',
                selectedType === 'video' 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-300 hover:border-gray-400'
              ]"
            >
              <svg class="h-8 w-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <div class="font-medium">Video</div>
              <div class="text-xs text-gray-500">Generate videos</div>
            </button>
            
            <button
              @click="selectedType = 'prompt'"
              :class="[
                'p-4 border-2 rounded-lg text-center transition-colors',
                selectedType === 'prompt' 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-300 hover:border-gray-400'
              ]"
            >
              <svg class="h-8 w-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div class="font-medium">Prompt</div>
              <div class="text-xs text-gray-500">Generate text prompts</div>
            </button>
          </div>
        </div>

        <!-- Asset Generation Form -->
        <div v-if="selectedType">
          <ImageGenerator
            v-if="selectedType === 'image'"
            :project="project"
            @generate="handleGenerate"
            @cancel="$emit('close')"
          />
          
          <VideoGenerator
            v-else-if="selectedType === 'video'"
            :project="project"
            @generate="handleGenerate"
            @cancel="$emit('close')"
          />
          
          <PromptGenerator
            v-else-if="selectedType === 'prompt'"
            :project="project"
            @generate="handleGenerate"
            @cancel="$emit('close')"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Project, Asset, GenerationJob } from '@asset-tool/types'
import ImageGenerator from './ImageGenerator.vue'
import VideoGenerator from './VideoGenerator.vue'
import PromptGenerator from './PromptGenerator.vue'

interface Props {
  project: Project
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  generated: [{ asset: Asset; job: GenerationJob }]
}>()

const selectedType = ref<'image' | 'video' | 'prompt'>('image')

function handleGenerate(result: { asset: Asset; job: GenerationJob }) {
  emit('generated', result)
}

function handleBackdropClick(event: MouseEvent) {
  if (event.target === event.currentTarget) {
    emit('close')
  }
}
</script>