import { z } from 'zod';

/**
 * Prompt Component Schema
 */
export const PromptComponentSchema = z.object({
  id: z.string(),
  type: z.enum(['subject', 'style', 'composition', 'lighting', 'camera', 'mood', 'quality', 'technical']),
  label: z.string(),
  value: z.string(),
  description: z.string().optional(),
  weight: z.number().min(1).max(10).optional()
});

export type PromptComponent = z.infer<typeof PromptComponentSchema>;

/**
 * Prompt Breakdown Schema
 */
export const PromptBreakdownSchema = z.object({
  id: z.string(),
  originalPrompt: z.string(),
  components: z.array(PromptComponentSchema),
  reconstructedPrompt: z.string(),
  createdAt: z.string().datetime(),
  projectId: z.string().optional(),
  assetType: z.enum(['image', 'video', 'prompt']).optional()
});

export type PromptBreakdown = z.infer<typeof PromptBreakdownSchema>;

/**
 * Prompt Template Schema
 */
export const PromptTemplateSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  assetType: z.enum(['image', 'video', 'prompt']),
  category: z.string(),
  components: z.array(PromptComponentSchema.omit({ id: true, value: true })),
  examplePrompt: z.string(),
  tags: z.array(z.string()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export type PromptTemplate = z.infer<typeof PromptTemplateSchema>;

/**
 * Prompt History Schema
 */
export const PromptHistorySchema = z.object({
  id: z.string(),
  projectId: z.string(),
  assetId: z.string().optional(),
  originalPrompt: z.string(),
  enhancedPrompt: z.string().optional(),
  version: z.number().min(1),
  parentId: z.string().optional(),
  metadata: z.object({
    aiProvider: z.string().optional(),
    aiModel: z.string().optional(),
    enhancementType: z.enum(['manual', 'ai', 'template']).optional(),
    score: z.number().min(0).max(100).optional(),
    feedback: z.string().optional()
  }),
  createdAt: z.string().datetime()
});

export type PromptHistory = z.infer<typeof PromptHistorySchema>;

/**
 * Prompt Suggestion Schema
 */
export const PromptSuggestionSchema = z.object({
  id: z.string(),
  type: z.enum(['improvement', 'alternative', 'component', 'style']),
  title: z.string(),
  description: z.string(),
  suggestedChange: z.string(),
  confidence: z.number().min(0).max(1),
  category: z.string(),
  reasoning: z.string().optional()
});

export type PromptSuggestion = z.infer<typeof PromptSuggestionSchema>;

/**
 * API Request/Response Schemas
 */

// Breakdown Prompt API
export const BreakdownPromptRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  projectId: z.string().optional(),
  assetType: z.enum(['image', 'video', 'prompt']).optional(),
  aiConfig: z.object({
    provider: z.string(),
    model: z.string(),
    apiKey: z.string()
  }).optional()
});

export const BreakdownPromptResponseSchema = z.object({
  breakdown: PromptBreakdownSchema
});

export type BreakdownPromptRequest = z.infer<typeof BreakdownPromptRequestSchema>;
export type BreakdownPromptResponse = z.infer<typeof BreakdownPromptResponseSchema>;

// Generate Suggestions API
export const GeneratePromptSuggestionsRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  projectId: z.string().optional(),
  assetType: z.enum(['image', 'video', 'prompt']).optional(),
  aiConfig: z.object({
    provider: z.string(),
    model: z.string(),
    apiKey: z.string()
  }).optional()
});

export const GeneratePromptSuggestionsResponseSchema = z.object({
  suggestions: z.array(PromptSuggestionSchema)
});

export type GeneratePromptSuggestionsRequest = z.infer<typeof GeneratePromptSuggestionsRequestSchema>;
export type GeneratePromptSuggestionsResponse = z.infer<typeof GeneratePromptSuggestionsResponseSchema>;

// Get Templates API
export const GetPromptTemplatesRequestSchema = z.object({
  assetType: z.enum(['image', 'video', 'prompt']).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional()
});

export const GetPromptTemplatesResponseSchema = z.object({
  templates: z.array(PromptTemplateSchema)
});

export type GetPromptTemplatesRequest = z.infer<typeof GetPromptTemplatesRequestSchema>;
export type GetPromptTemplatesResponse = z.infer<typeof GetPromptTemplatesResponseSchema>;

// Create Template API
export const CreatePromptTemplateRequestSchema = PromptTemplateSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const CreatePromptTemplateResponseSchema = z.object({
  template: PromptTemplateSchema
});

export type CreatePromptTemplateRequest = z.infer<typeof CreatePromptTemplateRequestSchema>;
export type CreatePromptTemplateResponse = z.infer<typeof CreatePromptTemplateResponseSchema>;

// Get History API
export const GetPromptHistoryRequestSchema = z.object({
  projectId: z.string(),
  assetId: z.string().optional(),
  limit: z.number().min(1).max(100).default(50).optional(),
  offset: z.number().min(0).default(0).optional()
});

export const GetPromptHistoryResponseSchema = z.object({
  history: z.array(PromptHistorySchema),
  total: z.number(),
  hasMore: z.boolean()
});

export type GetPromptHistoryRequest = z.infer<typeof GetPromptHistoryRequestSchema>;
export type GetPromptHistoryResponse = z.infer<typeof GetPromptHistoryResponseSchema>;

// Save History API
export const SavePromptHistoryRequestSchema = z.object({
  projectId: z.string(),
  originalPrompt: z.string().min(1, 'Original prompt is required'),
  enhancedPrompt: z.string().optional(),
  assetId: z.string().optional(),
  metadata: z.object({
    aiProvider: z.string().optional(),
    aiModel: z.string().optional(),
    enhancementType: z.enum(['manual', 'ai', 'template']).optional(),
    score: z.number().min(0).max(100).optional(),
    feedback: z.string().optional()
  }).optional()
});

export const SavePromptHistoryResponseSchema = z.object({
  history: PromptHistorySchema
});

export type SavePromptHistoryRequest = z.infer<typeof SavePromptHistoryRequestSchema>;
export type SavePromptHistoryResponse = z.infer<typeof SavePromptHistoryResponseSchema>;