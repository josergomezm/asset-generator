<template>
  <div class="w-full">
    <!-- Progress Bar -->
    <div class="flex items-center justify-between mb-2">
      <span class="text-sm font-medium text-gray-700">{{ label }}</span>
      <span class="text-sm text-gray-500">{{ progress }}%</span>
    </div>
    
    <div class="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
      <div 
        class="h-2 rounded-full transition-all duration-300 ease-out"
        :class="progressBarClass"
        :style="{ width: `${progress}%` }"
      >
        <!-- Animated stripe effect for active progress -->
        <div 
          v-if="animated && progress > 0 && progress < 100"
          class="h-full w-full bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"
        ></div>
      </div>
    </div>
    
    <!-- Status Message -->
    <div v-if="message" class="mt-2 text-xs text-gray-600">
      {{ message }}
    </div>
    
    <!-- Steps Indicator (optional) -->
    <div v-if="steps && steps.length > 0" class="mt-3">
      <div class="flex items-center justify-between text-xs">
        <div
          v-for="(step, index) in steps"
          :key="index"
          class="flex items-center"
          :class="{ 'opacity-50': index > currentStep }"
        >
          <div
            class="w-2 h-2 rounded-full mr-2"
            :class="getStepClass(index)"
          ></div>
          <span class="hidden sm:inline">{{ step }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  progress: number
  label?: string
  message?: string
  variant?: 'default' | 'success' | 'error' | 'warning'
  animated?: boolean
  steps?: string[]
  currentStep?: number
}

const props = withDefaults(defineProps<Props>(), {
  progress: 0,
  label: 'Progress',
  variant: 'default',
  animated: true,
  currentStep: 0
})

const progressBarClass = computed(() => {
  const variantClasses = {
    default: 'bg-blue-600',
    success: 'bg-green-600',
    error: 'bg-red-600',
    warning: 'bg-yellow-600'
  }
  
  return variantClasses[props.variant]
})

function getStepClass(index: number): string {
  if (index < props.currentStep) {
    return 'bg-green-500' // Completed
  } else if (index === props.currentStep) {
    return 'bg-blue-500' // Current
  } else {
    return 'bg-gray-300' // Pending
  }
}
</script>