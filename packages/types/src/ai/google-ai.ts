import { z } from 'zod';

/**
 * Google AI Configuration Schema
 */
export const GoogleAIConfigSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
  model: z.string().min(1, 'Model is required'),
});

export type GoogleAIConfig = z.infer<typeof GoogleAIConfigSchema>;

/**
 * Google AI Text Generation Options Schema
 */
export const GoogleAITextGenerationOptionsSchema = z.object({
  temperature: z.number().min(0).max(2).optional(),
  maxOutputTokens: z.number().min(1).max(8192).optional(),
  topP: z.number().min(0).max(1).optional(),
  topK: z.number().min(1).max(100).optional(),
});

export type GoogleAITextGenerationOptions = z.infer<typeof GoogleAITextGenerationOptionsSchema>;

/**
 * Google AI Response Schema
 */
export const GoogleAIResponseSchema = z.object({
  text: z.string(),
  finishReason: z.string().optional(),
  safetyRatings: z.array(z.object({
    category: z.string(),
    probability: z.string(),
  })).optional(),
});

export type GoogleAIResponse = z.infer<typeof GoogleAIResponseSchema>;

/**
 * Prompt Enhancement Request Schema
 */
export const PromptEnhancementRequestSchema = z.object({
  basePrompt: z.string().min(1, 'Base prompt is required'),
  assetType: z.enum(['image', 'video', 'prompt']).optional(),
  artStyle: z.string().optional(),
  styleKeywords: z.array(z.string()).optional(),
});

export type PromptEnhancementRequest = z.infer<typeof PromptEnhancementRequestSchema>;

/**
 * Prompt Suggestions Request Schema
 */
export const PromptSuggestionsRequestSchema = z.object({
  basePrompt: z.string().min(1, 'Base prompt is required'),
  assetType: z.enum(['image', 'video', 'prompt']).optional(),
  artStyle: z.string().optional(),
  count: z.number().min(1).max(10).default(3),
});

export type PromptSuggestionsRequest = z.infer<typeof PromptSuggestionsRequestSchema>;

/**
 * Prompt Score Response Schema
 */
export const PromptScoreResponseSchema = z.object({
  score: z.number().min(0).max(100),
  feedback: z.string(),
  suggestions: z.array(z.string()),
});

export type PromptScoreResponse = z.infer<typeof PromptScoreResponseSchema>;

/**
 * Prompt Scoring Request Schema
 */
export const PromptScoringRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  assetType: z.enum(['image', 'video', 'prompt']).optional(),
  artStyle: z.string().optional(),
});

export type PromptScoringRequest = z.infer<typeof PromptScoringRequestSchema>;

/**
 * Google AI API Request/Response Schemas for API endpoints
 */

// Enhance Prompt API
export const EnhancePromptRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  projectId: z.string().optional(),
  assetType: z.enum(['image', 'video', 'prompt']).optional(),
  config: GoogleAIConfigSchema,
  options: GoogleAITextGenerationOptionsSchema.optional(),
});

export const EnhancePromptResponseSchema = z.object({
  originalPrompt: z.string(),
  enhancedPrompt: z.string(),
  metadata: z.object({
    model: z.string(),
    finishReason: z.string().optional(),
    safetyRatings: z.array(z.object({
      category: z.string(),
      probability: z.string(),
    })).optional(),
  }),
});

export type EnhancePromptRequest = z.infer<typeof EnhancePromptRequestSchema>;
export type EnhancePromptResponse = z.infer<typeof EnhancePromptResponseSchema>;

// Generate Suggestions API
export const GenerateSuggestionsRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  projectId: z.string().optional(),
  assetType: z.enum(['image', 'video', 'prompt']).optional(),
  count: z.number().min(1).max(10).default(3),
  config: GoogleAIConfigSchema,
});

export const GenerateSuggestionsResponseSchema = z.object({
  originalPrompt: z.string(),
  suggestions: z.array(z.string()),
  metadata: z.object({
    model: z.string(),
    count: z.number(),
  }),
});

export type GenerateSuggestionsRequest = z.infer<typeof GenerateSuggestionsRequestSchema>;
export type GenerateSuggestionsResponse = z.infer<typeof GenerateSuggestionsResponseSchema>;

// Score Prompt API
export const ScorePromptRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  projectId: z.string().optional(),
  assetType: z.enum(['image', 'video', 'prompt']).optional(),
  config: GoogleAIConfigSchema,
});

export const ScorePromptResponseSchema = z.object({
  prompt: z.string(),
  score: z.number().min(0).max(100),
  feedback: z.string(),
  suggestions: z.array(z.string()),
  metadata: z.object({
    model: z.string(),
    assetType: z.string().optional(),
  }),
});

export type ScorePromptRequest = z.infer<typeof ScorePromptRequestSchema>;
export type ScorePromptResponse = z.infer<typeof ScorePromptResponseSchema>;