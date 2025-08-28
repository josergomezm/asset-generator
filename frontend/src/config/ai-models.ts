export interface AIModel {
  id: string
  name: string
  displayName: string
  provider: 'google' | 'openai' | 'anthropic'
  pricing: {
    input: number  // USD per 1M tokens
    output: number // USD per 1M tokens
  }
  description?: string
  maxTokens?: number
  features?: string[]
}

export const AI_MODELS: AIModel[] = [
  {
    "id": "gemini-2.0-flash",
    "name": "gemini-2.0-flash",
    "displayName": "Gemini 2.0 Flash",
    "provider": "google",
    "pricing": {
      "input": 0.10,
      "output": 0.40
    },
    "description": "A newer, faster Gemini model",
    "maxTokens": 1000000,
    "features": ["multimodal", "fast"]
  },
  {
    "id": "gemini-2.0-flash-lite",
    "name": "gemini-2.0-flash-lite",
    "displayName": "Gemini 2.0 Flash-Lite",
    "provider": "google",
    "pricing": {
      "input": 0.075,
      "output": 0.30
    },
    "description": "A lightweight version of the Gemini 2.0 Flash model",
    "maxTokens": 1000000,
    "features": ["fast", "cost-effective", "lightweight"]
  },
  {
    "id": "gemini-2.5-pro",
    "name": "gemini-2.5-pro",
    "displayName": "Gemini 2.5 Pro",
    "provider": "google",
    "pricing": {
      "input": 1.25,
      "output": 10.00
    },
    "description": "The latest and most capable Gemini model",
    "maxTokens": 2000000,
    "features": ["multimodal", "reasoning", "large-context"]
  },
  {
    "id": "gemini-2.5-flash",
    "name": "gemini-2.5-flash",
    "displayName": "Gemini 2.5 Flash",
    "provider": "google",
    "pricing": {
      "input": 0.30,
      "output": 2.50
    },
    "description": "A fast and efficient model for various tasks",
    "maxTokens": 1000000,
    "features": ["multimodal", "fast", "cost-effective"]
  },
  {
    "id": "gemini-2.5-flash-lite",
    "name": "gemini-2.5-flash-lite",
    "displayName": "Gemini 2.5 Flash-Lite",
    "provider": "google",
    "pricing": {
      "input": 0.10,
      "output": 0.40
    },
    "description": "A lightweight and cost-effective model for simple tasks",
    "maxTokens": 1000000,
    "features": ["fast", "cost-effective", "lightweight"]
  }
]

export function getModelById(id: string): AIModel | undefined {
  return AI_MODELS.find(model => model.id === id)
}

export function getModelsByProvider(provider: string): AIModel[] {
  return AI_MODELS.filter(model => model.provider === provider)
}

export function calculateTokenCost(inputTokens: number, outputTokens: number, modelId: string): number {
  const model = getModelById(modelId)
  if (!model) {
    console.warn(`Model ${modelId} not found, using default pricing`)
    return 0
  }

  const inputCost = (inputTokens / 1000000) * model.pricing.input
  const outputCost = (outputTokens / 1000000) * model.pricing.output
  return inputCost + outputCost
}

export function getDefaultModel(): AIModel {
  return AI_MODELS.find(model => model.id === 'gemini-1.5-flash') || AI_MODELS[0]
}