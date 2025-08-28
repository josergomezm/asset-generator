<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center">
            <router-link to="/" class="mr-4 text-gray-500 hover:text-gray-700">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
              </svg>
            </router-link>
            <h1 class="text-2xl font-bold text-gray-900">Settings</h1>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <div class="bg-white shadow rounded-lg">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-medium text-gray-900">AI Configuration</h2>
            <p class="mt-1 text-sm text-gray-500">Configure your AI settings for asset generation</p>
          </div>

          <form @submit.prevent="saveSettings" class="px-6 py-4 space-y-6">
            <div>
              <label for="gemini-api-key" class="block text-sm font-medium text-gray-700">
                Google Gemini API Key
              </label>
              <div class="mt-1">
                <input id="gemini-api-key" v-model="formData.geminiApiKey" type="password"
                  class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Enter your Gemini API key" />
              </div>
              <p class="mt-2 text-sm text-gray-500">
                Get your API key from the
                <a href="https://makersuite.google.com/app/apikey" target="_blank"
                  class="text-blue-600 hover:text-blue-500">
                  Google AI Studio
                </a>
              </p>
            </div>

            <div>
              <label for="model" class="block text-sm font-medium text-gray-700">
                Model
              </label>
              <div class="mt-1">
                <select id="model" v-model="formData.model"
                  class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md">
                  <option v-for="model in availableModels" :key="model.id" :value="model.id">
                    {{ model.displayName }}
                  </option>
                </select>
              </div>
              
              <!-- Model Information -->
              <div v-if="selectedModelInfo" class="mt-3 p-3 bg-gray-50 rounded-md">
                <div class="text-sm text-gray-700">
                  <p class="font-medium">{{ selectedModelInfo.displayName }}</p>
                  <p class="text-xs text-gray-600 mt-1">{{ selectedModelInfo.description }}</p>
                  
                  <div class="mt-2 grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span class="text-gray-500">Input:</span>
                      <span class="font-medium ml-1">${{ selectedModelInfo.pricing.input }}/1M tokens</span>
                    </div>
                    <div>
                      <span class="text-gray-500">Output:</span>
                      <span class="font-medium ml-1">${{ selectedModelInfo.pricing.output }}/1M tokens</span>
                    </div>
                  </div>
                  
                  <div v-if="selectedModelInfo.features" class="mt-2">
                    <div class="flex flex-wrap gap-1">
                      <span v-for="feature in selectedModelInfo.features" :key="feature"
                        class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        {{ feature }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex justify-end space-x-3">
              <button type="button" @click="testConnection"
                :disabled="!formData.geminiApiKey.trim() || isTestingConnection"
                class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                <svg v-if="isTestingConnection" class="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" fill="none"
                  viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                  </path>
                </svg>
                {{ isTestingConnection ? 'Testing...' : 'Test Connection' }}
              </button>
              <button type="submit"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Save Settings
              </button>
            </div>
          </form>
        </div>

        <!-- Test Results -->
        <div v-if="settingsStore.lastTestResult" class="mt-6 bg-white shadow rounded-lg">
          <div class="px-6 py-4">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <svg v-if="settingsStore.lastTestResult.success" class="h-5 w-5 text-green-400" fill="currentColor"
                  viewBox="0 0 20 20">
                  <path fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clip-rule="evenodd" />
                </svg>
                <svg v-else class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3 flex-1">
                <h3 class="text-sm font-medium text-gray-900">
                  {{ settingsStore.lastTestResult.success ? 'Connection Test Passed' : 'Connection Test Failed' }}
                </h3>
                <p class="text-sm text-gray-500">{{ settingsStore.lastTestResult.message }}</p>
                <div class="mt-1 flex items-center space-x-4 text-xs text-gray-400">
                  <span v-if="settingsStore.lastTestResult.responseTime">
                    Response time: {{ settingsStore.lastTestResult.responseTime }}ms
                  </span>
                  <span v-if="settingsStore.lastTestResult.testedAt">
                    Tested: {{ formatTestDate(settingsStore.lastTestResult.testedAt) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- API Key Status (fallback when no test results) -->
        <div v-else-if="settingsStore.aiSettings.geminiApiKey" class="mt-6 bg-white shadow rounded-lg">
          <div class="px-6 py-4">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-gray-900">API Key Configured</h3>
                <p class="text-sm text-gray-500">Your Gemini API key is set. Click "Test Connection" to verify it works.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { testAIConnection } from '@/services/ai'
import { AI_MODELS, getModelById, getDefaultModel } from '@/config/ai-models'

const settingsStore = useSettingsStore()
const isTestingConnection = ref(false)

const formData = reactive({
  geminiApiKey: '',
  model: getDefaultModel().id
})

const availableModels = computed(() => AI_MODELS)
const selectedModelInfo = computed(() => getModelById(formData.model))

onMounted(() => {
  settingsStore.loadSettings()
  formData.geminiApiKey = settingsStore.aiSettings.geminiApiKey
  formData.model = settingsStore.aiSettings.model
})

function saveSettings() {
  settingsStore.updateAISettings(formData)
  // Show success message (you could add a toast notification here)
  alert('Settings saved successfully!')
}

async function testConnection() {
  if (!formData.geminiApiKey.trim()) {
    return
  }

  isTestingConnection.value = true

  try {
    const result = await testAIConnection({
      geminiApiKey: formData.geminiApiKey,
      model: formData.model
    })

    settingsStore.saveTestResult(result)
  } catch (error) {
    settingsStore.saveTestResult({
      success: false,
      message: 'Unexpected error occurred during testing'
    })
  } finally {
    isTestingConnection.value = false
  }
}

function formatTestDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}
</script>