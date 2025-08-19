<template>
  <div class="flex items-center justify-center" :class="containerClass">
    <div class="relative">
      <!-- Spinner -->
      <div 
        class="animate-spin rounded-full border-solid border-t-transparent"
        :class="spinnerClass"
      ></div>
      
      <!-- Optional center icon -->
      <div v-if="showIcon" class="absolute inset-0 flex items-center justify-center">
        <slot name="icon">
          <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </slot>
      </div>
    </div>
    
    <!-- Loading text -->
    <div v-if="text" class="ml-3">
      <p :class="textClass">{{ text }}</p>
      <p v-if="subtext" class="text-xs text-gray-500 mt-1">{{ subtext }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  color?: 'blue' | 'gray' | 'green' | 'yellow' | 'red' | 'purple'
  text?: string
  subtext?: string
  showIcon?: boolean
  fullScreen?: boolean
  overlay?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  color: 'blue',
  showIcon: false,
  fullScreen: false,
  overlay: false
})

const containerClass = computed(() => {
  const classes = []
  
  if (props.fullScreen) {
    classes.push('fixed inset-0 z-50')
  }
  
  if (props.overlay) {
    classes.push('bg-white bg-opacity-75 backdrop-blur-sm')
  }
  
  return classes.join(' ')
})

const spinnerClass = computed(() => {
  const sizeClasses = {
    xs: 'w-4 h-4 border-2',
    sm: 'w-6 h-6 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
    xl: 'w-16 h-16 border-4'
  }
  
  const colorClasses = {
    blue: 'border-blue-200 border-t-blue-600',
    gray: 'border-gray-200 border-t-gray-600',
    green: 'border-green-200 border-t-green-600',
    yellow: 'border-yellow-200 border-t-yellow-600',
    red: 'border-red-200 border-t-red-600',
    purple: 'border-purple-200 border-t-purple-600'
  }
  
  return `${sizeClasses[props.size]} ${colorClasses[props.color]}`
})

const textClass = computed(() => {
  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  }
  
  return `${sizeClasses[props.size]} font-medium text-gray-900`
})
</script>

<style scoped>
.border-3 {
  border-width: 3px;
}
</style>