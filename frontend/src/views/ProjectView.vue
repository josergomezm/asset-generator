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
            <h1 class="text-2xl font-bold text-gray-900">{{ project?.name }}</h1>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <!-- Project Information -->
        <div class="bg-white shadow rounded-lg mb-6">
          <div class="px-6 py-4 border-b border-gray-200">
            <div class="flex justify-between items-center">
              <h2 class="text-lg font-medium text-gray-900">Project Information</h2>
              <button @click="toggleEditMode"
                class="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <svg v-if="!isEditing" class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z">
                  </path>
                </svg>
                <svg v-else class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
                {{ isEditing ? 'Cancel' : 'Edit' }}
              </button>
            </div>
          </div>

          <div v-if="!isEditing" class="px-6 py-4">
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt class="text-sm font-medium text-gray-500">Name</dt>
                <dd class="mt-1 text-sm text-gray-900">{{ project?.name }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">Category</dt>
                <dd class="mt-1 text-sm text-gray-900 capitalize">{{ project?.category }}</dd>
              </div>
              <div class="sm:col-span-2">
                <dt class="text-sm font-medium text-gray-500">Description</dt>
                <dd class="mt-1 text-sm text-gray-900">{{ project?.description }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">Created</dt>
                <dd class="mt-1 text-sm text-gray-900">{{ formatDate(project?.createdAt) }}</dd>
              </div>
            </div>
          </div>

          <form v-else @submit.prevent="saveProjectChanges" class="px-6 py-4 space-y-4">
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label for="project-name" class="block text-sm font-medium text-gray-700">Name</label>
                <input id="project-name" v-model="editForm.name" type="text" required
                  class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
              </div>
              <div>
                <label for="project-category" class="block text-sm font-medium text-gray-700">Category</label>
                <select id="project-category" v-model="editForm.category"
                  class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                  <option value="business">Business</option>
                  <option value="personal">Personal</option>
                  <option value="education">Education</option>
                  <option value="creative">Creative</option>
                  <option value="technology">Technology</option>
                  <option value="marketing">Marketing</option>
                </select>
              </div>
              <div class="sm:col-span-2">
                <label for="project-description" class="block text-sm font-medium text-gray-700">Description</label>
                <textarea id="project-description" v-model="editForm.description" rows="3"
                  class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Describe your project..."></textarea>
              </div>
            </div>
            <div class="flex justify-end space-x-3">
              <button type="button" @click="cancelEdit"
                class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Cancel
              </button>
              <button type="submit"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Save Changes
              </button>
            </div>
          </form>
        </div>

        <!-- Project Cost Summary -->
        <div v-if="getProjectTotalCost() > 0" class="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-medium text-green-800">Project AI Usage</h3>
              <p class="text-xs text-green-600 mt-1">Total cost across all assets</p>
            </div>
            <div class="text-right">
              <div class="text-lg font-bold text-green-800">${{ getProjectTotalCost().toFixed(4) }}</div>
              <div class="text-xs text-green-600">{{ getProjectTotalTokens().toLocaleString() }} tokens</div>
              <div class="text-xs text-green-600">{{ getProjectTotalGenerations() }} generations</div>
            </div>
          </div>
        </div>

        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-semibold text-gray-900">Project Assets</h2>
          <button @click="showCreateAsset = true"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
            Add Asset
          </button>
        </div>

        <div v-if="assets.length === 0" class="text-center py-12">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">No assets</h3>
          <p class="mt-1 text-sm text-gray-500">Start creating assets for your project.</p>
        </div>

        <div v-else class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div v-for="asset in assets" :key="asset.id"
            class="bg-white overflow-hidden shadow rounded-lg flex flex-col max-h-96">
            <div class="p-6 flex-1 flex flex-col">
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div class="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center">
                      <component :is="getAssetIcon(asset.type)" class="w-4 h-4 text-gray-600" />
                    </div>
                  </div>
                  <div class="ml-3">
                    <h3 class="text-sm font-medium text-gray-900">{{ asset.name }}</h3>
                    <p class="text-xs text-gray-500 capitalize">{{ asset.type }}</p>
                  </div>
                </div>
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="getStatusClass(asset.status)">
                  {{ asset.status }}
                </span>
              </div>
              <p class="mt-4 text-sm text-gray-600 line-clamp-3">{{ asset.context }}</p>
              <div v-if="asset.prompt" class="mt-3 p-3 bg-gray-50 rounded-md flex-1 flex flex-col">
                <div class="flex items-center justify-between mb-1">
                  <p class="text-xs font-medium text-gray-700">Generated Prompt:</p>
                  <button @click="openPromptModal(asset)" class="text-xs text-blue-600 hover:text-blue-800 font-medium">
                    View Full
                  </button>
                </div>
                <p class="text-xs text-gray-600 line-clamp-3 flex-1">{{ asset.prompt }}</p>
              </div>
              <div class="mt-4 flex items-center justify-between text-xs text-gray-500">
                <span>{{ formatDate(asset.createdAt) }}</span>
                <div v-if="asset.totalCost" class="flex items-center space-x-2">
                  <span class="text-green-600 font-medium">${{ asset.totalCost.toFixed(4) }}</span>
                  <span class="text-gray-400">•</span>
                  <span>{{ (asset.totalTokens || 0).toLocaleString() }} tokens</span>
                  <span v-if="asset.tokenUsage && asset.tokenUsage.length > 1" class="text-blue-600">
                    ({{ asset.tokenUsage.length }}x)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Create Asset Modal -->
    <CreateAssetModal v-if="showCreateAsset" :project="project!" @close="showCreateAsset = false"
      @created="onAssetCreated" />

    <!-- Prompt View Modal -->
    <div v-if="selectedAsset" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-10 mb-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div class="mt-3">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-lg font-medium text-gray-900">{{ selectedAsset.name }}</h3>
              <p class="text-sm text-gray-500 capitalize">{{ selectedAsset.type }} Asset</p>
            </div>
            <button @click="closePromptModal" class="text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <div class="space-y-6">
            <div>
              <h4 class="text-sm font-medium text-gray-700 mb-2">Context & Usage</h4>
              <div class="p-4 bg-gray-50 rounded-md">
                <p class="text-sm text-gray-900">{{ selectedAsset.context }}</p>
              </div>
            </div>

            <!-- Token Usage Stats -->
            <div v-if="selectedAsset.tokenUsage && selectedAsset.tokenUsage.length > 0"
              class="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h4 class="text-sm font-medium text-gray-700 mb-3">Token Usage & Cost</h4>
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span class="text-gray-600">Total Generations:</span>
                  <span class="font-medium ml-2">{{ selectedAsset.tokenUsage.length }}</span>
                </div>
                <div>
                  <span class="text-gray-600">Total Cost:</span>
                  <span class="font-medium ml-2">${{ (selectedAsset.totalCost || 0).toFixed(4) }}</span>
                </div>
                <div>
                  <span class="text-gray-600">Total Tokens:</span>
                  <span class="font-medium ml-2">{{ (selectedAsset.totalTokens || 0).toLocaleString() }}</span>
                </div>
                <div>
                  <span class="text-gray-600">Latest Generation:</span>
                  <span class="font-medium ml-2">${{ getLatestGenerationCost(selectedAsset).toFixed(4) }}</span>
                </div>
              </div>

              <!-- Detailed breakdown for latest generation -->
              <div v-if="selectedAsset.tokenUsage.length > 0" class="mt-3 pt-3 border-t border-blue-200">
                <div class="text-xs text-gray-600 space-y-1">
                  <div class="flex justify-between">
                    <span>Input tokens:</span>
                    <span>{{ getLatestTokenUsage(selectedAsset).inputTokens.toLocaleString() }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span>Output tokens:</span>
                    <span>{{ getLatestTokenUsage(selectedAsset).outputTokens.toLocaleString() }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span>Model:</span>
                    <span>{{ getModelById(settingsStore.aiSettings.model)?.displayName || settingsStore.aiSettings.model
                      }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span>Generated:</span>
                    <span>{{ formatDate(getLatestTokenUsage(selectedAsset).timestamp) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="selectedAsset.prompt">
              <div class="flex items-center justify-between mb-2">
                <h4 class="text-sm font-medium text-gray-700">Generated Prompt</h4>
                <div class="flex space-x-2">
                  <button @click="togglePromptEdit"
                    class="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    <svg v-if="!isEditingPrompt" class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z">
                      </path>
                    </svg>
                    <svg v-else class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12">
                      </path>
                    </svg>
                    {{ isEditingPrompt ? 'Cancel' : 'Edit' }}
                  </button>
                  <button v-if="isEditingPrompt" @click="savePromptChanges"
                    class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Save
                  </button>
                  <template v-else>
                    <button @click="regeneratePrompt" :disabled="isRegenerating"
                      class="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                      <svg v-if="isRegenerating" class="animate-spin w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4">
                        </circle>
                        <path class="opacity-75" fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                        </path>
                      </svg>
                      <svg v-else class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15">
                        </path>
                      </svg>
                      <span>{{ isRegenerating ? 'Generating...' : 'Try Again' }}</span>
                      <span v-if="!isRegenerating && selectedAsset.tokenUsage && selectedAsset.tokenUsage.length > 0"
                        class="ml-1 text-green-600 font-medium">
                        (~${{ getLatestGenerationCost(selectedAsset).toFixed(4) }})
                      </span>
                    </button>
                    <button @click="copyPromptToClipboard"
                      class="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                      <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z">
                        </path>
                      </svg>
                      Copy
                    </button>
                  </template>
                </div>
              </div>
              <div v-if="!isEditingPrompt" class="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <p class="text-sm text-gray-900 whitespace-pre-wrap">{{ selectedAsset.prompt }}</p>
              </div>
              <div v-else class="space-y-3">
                <textarea v-model="editingPrompt" rows="8"
                  class="w-full p-4 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Edit your prompt here..."></textarea>
                <p class="text-xs text-gray-500">
                  Tip: Make your prompt as specific as possible for better AI generation results.
                </p>
              </div>
            </div>

            <div class="flex items-center justify-between text-xs text-gray-500 pt-4 border-t">
              <span>Created: {{ formatDate(selectedAsset.createdAt) }}</span>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                :class="getStatusClass(selectedAsset.status)">
                {{ selectedAsset.status }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Token Usage Notification -->
    <div v-if="showTokenNotification && lastGenerationStats"
      class="fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-lg z-50 max-w-sm">
      <div class="flex items-center">
        <svg class="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clip-rule="evenodd" />
        </svg>
        <div>
          <div class="font-medium text-sm">Prompt Generated!</div>
          <div class="text-xs">
            Cost: ${{ lastGenerationStats.cost.toFixed(4) }} •
            Tokens: {{ lastGenerationStats.tokens.toLocaleString() }}
          </div>
        </div>
        <button @click="showTokenNotification = false" class="ml-3 text-green-400 hover:text-green-600">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectsStore, type Asset } from '@/stores/projects'
import { useSettingsStore } from '@/stores/settings'
import { generateAssetPrompt } from '@/services/ai'
import { getModelById } from '@/config/ai-models'
import CreateAssetModal from '@/components/CreateAssetModal.vue'

const route = useRoute()
const router = useRouter()
const projectsStore = useProjectsStore()
const settingsStore = useSettingsStore()
const showCreateAsset = ref(false)
const isEditing = ref(false)
const selectedAsset = ref<Asset | null>(null)
const isEditingPrompt = ref(false)
const editingPrompt = ref('')
const isRegenerating = ref(false)
const showTokenNotification = ref(false)
const lastGenerationStats = ref<{ cost: number; tokens: number } | null>(null)

const editForm = reactive({
  name: '',
  description: '',
  category: ''
})

const project = computed(() => {
  const id = route.params.id as string
  return projectsStore.getProjectById(id)
})

const assets = computed(() => {
  if (!project.value) return []
  return projectsStore.getAssetsByProject(project.value.id)
})

onMounted(async () => {
  await projectsStore.loadData()
  if (!project.value) {
    router.push('/')
  }
})

function onAssetCreated() {
  showCreateAsset.value = false
}

function getAssetIcon(type: string) {
  const icons = {
    image: 'svg',
    text: 'svg',
    video: 'svg',
    audio: 'svg'
  }
  return icons[type as keyof typeof icons] || 'svg'
}

function getStatusClass(status: string) {
  const classes = {
    draft: 'bg-gray-100 text-gray-800',
    generating: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    error: 'bg-red-100 text-red-800'
  }
  return classes[status as keyof typeof classes] || 'bg-gray-100 text-gray-800'
}

function formatDate(date: Date | undefined) {
  if (!date) return 'Unknown'
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date)
}

function toggleEditMode() {
  if (!isEditing.value && project.value) {
    // Entering edit mode - populate form with current values
    editForm.name = project.value.name
    editForm.description = project.value.description
    editForm.category = project.value.category
  }
  isEditing.value = !isEditing.value
}

function cancelEdit() {
  isEditing.value = false
  // Reset form values
  if (project.value) {
    editForm.name = project.value.name
    editForm.description = project.value.description
    editForm.category = project.value.category
  }
}

function saveProjectChanges() {
  if (!project.value) return

  projectsStore.updateProject(project.value.id, {
    name: editForm.name,
    description: editForm.description,
    category: editForm.category
  })

  isEditing.value = false
}

function openPromptModal(asset: Asset) {
  selectedAsset.value = asset
  isEditingPrompt.value = false
  editingPrompt.value = asset.prompt || ''
}

function closePromptModal() {
  selectedAsset.value = null
  isEditingPrompt.value = false
  editingPrompt.value = ''
}

function togglePromptEdit() {
  if (!isEditingPrompt.value && selectedAsset.value) {
    // Entering edit mode - populate textarea with current prompt
    editingPrompt.value = selectedAsset.value.prompt || ''
  }
  isEditingPrompt.value = !isEditingPrompt.value
}

async function savePromptChanges() {
  if (!selectedAsset.value || !editingPrompt.value.trim()) return

  try {
    await projectsStore.updateAsset(selectedAsset.value.id, {
      prompt: editingPrompt.value.trim()
    })

    // Update the selected asset reference
    selectedAsset.value.prompt = editingPrompt.value.trim()
    isEditingPrompt.value = false
  } catch (error) {
    console.error('Failed to update prompt:', error)
  }
}

async function regeneratePrompt() {
  if (!selectedAsset.value || !project.value) return

  isRegenerating.value = true

  try {
    // Load settings if not already loaded
    settingsStore.loadSettings()

    // Generate new prompt
    const result = await generateAssetPrompt(project.value, selectedAsset.value, settingsStore.aiSettings)

    // Calculate cumulative totals
    const existingTokenUsage = selectedAsset.value.tokenUsage || []
    const newTokenUsage = [...existingTokenUsage, result.tokenUsage]
    const totalTokens = newTokenUsage.reduce((sum, usage) => sum + usage.totalTokens, 0)
    const totalCost = newTokenUsage.reduce((sum, usage) => sum + usage.estimatedCost, 0)

    // Update the asset with the new prompt and token usage
    await projectsStore.updateAsset(selectedAsset.value.id, {
      prompt: result.prompt,
      status: 'completed',
      tokenUsage: newTokenUsage,
      totalTokens,
      totalCost
    })

    // Update the selected asset reference
    selectedAsset.value.prompt = result.prompt
    selectedAsset.value.status = 'completed'
    selectedAsset.value.tokenUsage = newTokenUsage
    selectedAsset.value.totalTokens = totalTokens
    selectedAsset.value.totalCost = totalCost

    // Show success notification with token stats
    lastGenerationStats.value = {
      cost: result.tokenUsage.estimatedCost,
      tokens: result.tokenUsage.totalTokens
    }
    showTokenNotification.value = true
    setTimeout(() => {
      showTokenNotification.value = false
    }, 5000)

  } catch (error) {
    console.error('Failed to regenerate prompt:', error)

    // Update status to error
    await projectsStore.updateAsset(selectedAsset.value.id, {
      status: 'error'
    })
    selectedAsset.value.status = 'error'
  } finally {
    isRegenerating.value = false
  }
}

function getLatestTokenUsage(asset: Asset) {
  if (!asset.tokenUsage || asset.tokenUsage.length === 0) {
    return {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      estimatedCost: 0,
      timestamp: new Date()
    }
  }
  return asset.tokenUsage[asset.tokenUsage.length - 1]
}

function getLatestGenerationCost(asset: Asset) {
  const latest = getLatestTokenUsage(asset)
  return latest.estimatedCost
}

function getProjectTotalCost() {
  return assets.value.reduce((total, asset) => total + (asset.totalCost || 0), 0)
}

function getProjectTotalTokens() {
  return assets.value.reduce((total, asset) => total + (asset.totalTokens || 0), 0)
}

function getProjectTotalGenerations() {
  return assets.value.reduce((total, asset) => total + (asset.tokenUsage?.length || 0), 0)
}

async function copyPromptToClipboard() {
  if (!selectedAsset.value?.prompt) return

  try {
    await navigator.clipboard.writeText(selectedAsset.value.prompt)
    // You could add a toast notification here
  } catch (error) {
    console.error('Failed to copy prompt:', error)
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = selectedAsset.value.prompt
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
  }
}
</script>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>