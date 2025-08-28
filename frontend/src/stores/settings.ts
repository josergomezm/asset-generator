import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getDefaultModel, getModelById } from '@/config/ai-models'

export interface AISettings {
  geminiApiKey: string
  model: string
}

export interface TestResult {
  success: boolean
  message: string
  responseTime?: number
  testedAt?: Date
}

export const useSettingsStore = defineStore('settings', () => {
  const aiSettings = ref<AISettings>({
    geminiApiKey: '',
    model: getDefaultModel().id
  })

  const lastTestResult = ref<TestResult | null>(null)

  function updateAISettings(settings: Partial<AISettings>) {
    aiSettings.value = { ...aiSettings.value, ...settings }
    // Save to localStorage
    localStorage.setItem('ai-settings', JSON.stringify(aiSettings.value))
    // Clear test result when settings change
    lastTestResult.value = null
    localStorage.removeItem('ai-test-result')
  }

  function saveTestResult(result: TestResult) {
    const resultWithTimestamp = {
      ...result,
      testedAt: new Date()
    }
    lastTestResult.value = resultWithTimestamp
    localStorage.setItem('ai-test-result', JSON.stringify(resultWithTimestamp))
  }

  function loadSettings() {
    const saved = localStorage.getItem('ai-settings')
    if (saved) {
      const parsedSettings = JSON.parse(saved)
      // Validate that the saved model still exists in our configuration
      const defaultModel = getDefaultModel()
      const modelExists = getModelById(parsedSettings.model)
      aiSettings.value = {
        ...parsedSettings,
        model: modelExists ? parsedSettings.model : defaultModel.id
      }
    }

    const testResult = localStorage.getItem('ai-test-result')
    if (testResult) {
      const parsed = JSON.parse(testResult)
      // Convert testedAt back to Date object
      if (parsed.testedAt) {
        parsed.testedAt = new Date(parsed.testedAt)
      }
      lastTestResult.value = parsed
    }
  }

  return {
    aiSettings,
    lastTestResult,
    updateAISettings,
    saveTestResult,
    loadSettings
  }
})