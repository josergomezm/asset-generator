import { getModelById, type AIModel } from '@/config/ai-models'

/**
 * Format model name for display
 */
export function formatModelName(modelId: string): string {
  const model = getModelById(modelId)
  return model?.displayName || modelId
}

/**
 * Get pricing information for a model
 */
export function getModelPricing(modelId: string) {
  const model = getModelById(modelId)
  return model?.pricing || { input: 0, output: 0 }
}

/**
 * Calculate estimated cost for a generation
 */
export function estimateGenerationCost(modelId: string, estimatedInputTokens: number = 1000, estimatedOutputTokens: number = 500) {
  const pricing = getModelPricing(modelId)
  const inputCost = (estimatedInputTokens / 1000000) * pricing.input
  const outputCost = (estimatedOutputTokens / 1000000) * pricing.output
  return inputCost + outputCost
}

/**
 * Format cost for display
 */
export function formatCost(cost: number): string {
  if (cost < 0.0001) {
    return '<$0.0001'
  }
  return `$${cost.toFixed(4)}`
}

/**
 * Format token count for display
 */
export function formatTokenCount(tokens: number): string {
  if (tokens < 1000) {
    return tokens.toString()
  }
  return tokens.toLocaleString()
}

/**
 * Get model features as a formatted string
 */
export function getModelFeatures(modelId: string): string[] {
  const model = getModelById(modelId)
  return model?.features || []
}

/**
 * Compare models by cost efficiency (tokens per dollar)
 */
export function compareModelEfficiency(modelId1: string, modelId2: string): {
  model1: string
  model2: string
  winner: string
  difference: string
} {
  const model1 = getModelById(modelId1)
  const model2 = getModelById(modelId2)
  
  if (!model1 || !model2) {
    return {
      model1: modelId1,
      model2: modelId2,
      winner: 'unknown',
      difference: 'Cannot compare - model not found'
    }
  }

  // Calculate average cost per token (assuming 50/50 input/output split)
  const avgCost1 = (model1.pricing.input + model1.pricing.output) / 2
  const avgCost2 = (model2.pricing.input + model2.pricing.output) / 2
  
  const winner = avgCost1 < avgCost2 ? model1.displayName : model2.displayName
  const difference = Math.abs(avgCost1 - avgCost2).toFixed(4)
  
  return {
    model1: model1.displayName,
    model2: model2.displayName,
    winner,
    difference: `$${difference}/1M tokens`
  }
}