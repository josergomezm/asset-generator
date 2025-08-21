/**
 * Prompt management routes
 */

import { Router } from 'express';
import { promptController } from '../controllers/PromptController';
import { validate, CommonParams, CommonQuery } from '../middleware/validation';
import { z } from 'zod';
import {
  BreakdownPromptRequestSchema,
  GeneratePromptSuggestionsRequestSchema,
  CreatePromptTemplateRequestSchema,
  SavePromptHistoryRequestSchema
} from '@asset-tool/types';

const router = Router();

/**
 * POST /api/prompts/breakdown
 * Break down a prompt into components
 */
router.post(
  '/breakdown',
  validate({ body: BreakdownPromptRequestSchema }),
  promptController.breakdownPrompt.bind(promptController)
);

/**
 * POST /api/prompts/suggestions
 * Generate prompt suggestions
 */
router.post(
  '/suggestions',
  validate({ body: GeneratePromptSuggestionsRequestSchema }),
  promptController.generateSuggestions.bind(promptController)
);

/**
 * POST /api/prompts/score
 * Score a prompt for quality and effectiveness
 */
router.post(
  '/score',
  validate({ body: GeneratePromptSuggestionsRequestSchema }), // Reuse same schema as suggestions
  promptController.scorePrompt.bind(promptController)
);

// Query schema for template filtering
const getTemplatesQuery = z.object({
  assetType: z.enum(['image', 'video', 'prompt']).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).or(z.string()).optional().transform(val => 
    Array.isArray(val) ? val : val ? [val] : undefined
  )
});

/**
 * GET /api/prompts/templates
 * Get prompt templates with optional filtering
 */
router.get(
  '/templates',
  validate({ query: getTemplatesQuery }),
  promptController.getTemplates.bind(promptController)
);

/**
 * POST /api/prompts/templates
 * Create a new prompt template
 */
router.post(
  '/templates',
  validate({ body: CreatePromptTemplateRequestSchema }),
  promptController.createTemplate.bind(promptController)
);

// Query schema for history filtering
const getHistoryQuery = z.object({
  assetId: z.string().uuid().optional(),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20),
  offset: z.string().optional().transform(val => val ? parseInt(val, 10) : 0)
}).refine(data => data.limit >= 1 && data.limit <= 100, { message: 'Limit must be between 1 and 100' })
  .refine(data => data.offset >= 0, { message: 'Offset must be >= 0' });

/**
 * GET /api/prompts/history/:projectId
 * Get prompt history for a project
 */
router.get(
  '/history/:projectId',
  validate({ 
    params: CommonParams.projectId,
    query: getHistoryQuery 
  }),
  promptController.getHistory.bind(promptController)
);

/**
 * POST /api/prompts/history
 * Save prompt to history
 */
router.post(
  '/history',
  validate({ body: SavePromptHistoryRequestSchema }),
  promptController.saveHistory.bind(promptController)
);

export default router;