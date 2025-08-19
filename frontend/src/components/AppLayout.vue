<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Navigation Header -->
    <nav class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <router-link to="/" class="flex items-center space-x-2">
              <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span class="text-white font-bold text-sm">AG</span>
              </div>
              <span class="text-lg sm:text-xl font-semibold text-gray-900 hidden xs:block">Asset Generator</span>
              <span class="text-lg sm:text-xl font-semibold text-gray-900 block xs:hidden">AG</span>
            </router-link>
          </div>
          
          <!-- Desktop Navigation -->
          <div class="hidden sm:flex items-center space-x-4">
            <router-link 
              to="/" 
              class="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              :class="{ 'text-blue-600 bg-blue-50': route.name === 'projects' }"
            >
              Projects
            </router-link>
          </div>

          <!-- Mobile menu button -->
          <div class="sm:hidden flex items-center">
            <button
              @click="mobileMenuOpen = !mobileMenuOpen"
              class="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              :aria-expanded="mobileMenuOpen"
            >
              <span class="sr-only">Open main menu</span>
              <!-- Menu icon -->
              <svg v-if="!mobileMenuOpen" class="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <!-- Close icon -->
              <svg v-else class="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile menu -->
      <div v-show="mobileMenuOpen" class="sm:hidden">
        <div class="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-200">
          <router-link 
            to="/" 
            @click="mobileMenuOpen = false"
            class="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
            :class="{ 'text-blue-600 bg-blue-50': route.name === 'projects' }"
          >
            Projects
          </router-link>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const mobileMenuOpen = ref(false)

// Close mobile menu when route changes
route && (() => {
  mobileMenuOpen.value = false
})
</script>