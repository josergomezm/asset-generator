/**
 * Prompt Controller for handling prompt management API endpoints
 */

import { Request, Response } from 'express';
import { promptManagementService } from '../services/PromptManagementService';
import {
  BreakdownPromptRequestSchema,
  GeneratePromptSuggestionsRequestSchema,
  GetPromptTemplatesRequestSchema,
  CreatePromptTemplateRequestSchema,
  GetPromptHistoryRequestSchema,
  SavePromptHistoryRequestSchema
} from '@asset-tool/types';

export class PromptController {
  /**
   * Break down a prompt into components
   */
  async breakdownPrompt(req: Request, res: Response): Promise<void> {
    try {
      const validatedRequest = BreakdownPromptRequestSchema.parse(req.body);
      
      const breakdown = await promptManagementService.breakdownPrompt(
        validatedRequest.prompt,
        validatedRequest.projectId,
        validatedRequest.assetType,
        validatedRequest.aiConfig
      );

      res.status(200).json({
        breakdown
      });
    } catch (error) {
      console.error('Failed to breakdown prompt:', error);
      res.status(500).json({
        error: {
          code: 'BREAKDOWN_FAILED',
          message: `Failed to breakdown prompt: ${(error as Error).message}`,
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Generate prompt suggestions
   */
  async generateSuggestions(req: Request, res: Response): Promise<void> {
    try {
      const validatedRequest = GeneratePromptSuggestionsRequestSchema.parse(req.body);
      
      const suggestions = await promptManagementService.generatePromptSuggestions(
        validatedRequest.prompt,
        validatedRequest.projectId,
        validatedRequest.assetType,
        validatedRequest.aiConfig
      );

      res.status(200).json({
        suggestions
      });
    } catch (error) {
      console.error('Failed to generate prompt suggestions:', error);
      res.status(500).json({
        error: {
          code: 'SUGGESTIONS_FAILED',
          message: `Failed to generate suggestions: ${(error as Error).message}`,
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Get prompt templates
   */
  async getTemplates(req: Request, res: Response): Promise<void> {
    try {
      const { assetType, category, tags } = req.query;
      
      const validatedRequest = GetPromptTemplatesRequestSchema.parse({
        assetType: assetType as string,
        category: category as string,
        tags: tags ? (Array.isArray(tags) ? tags : [tags]) : undefined
      });

      const templates = await promptManagementService.getPromptTemplates(
        validatedRequest.assetType,
        validatedRequest.category,
        validatedRequest.tags
      );

      res.status(200).json({
        templates
      });
    } catch (error) {
      console.error('Failed to get prompt templates:', error);
      res.status(500).json({
        error: {
          code: 'GET_TEMPLATES_FAILED',
          message: `Failed to get templates: ${(error as Error).message}`,
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Create a new prompt template
   */
  async createTemplate(req: Request, res: Response): Promise<void> {
    try {
      const validatedRequest = CreatePromptTemplateRequestSchema.parse(req.body);
      
      const template = await promptManagementService.createPromptTemplate(validatedRequest);

      res.status(201).json({
        template
      });
    } catch (error) {
      console.error('Failed to create prompt template:', error);
      res.status(500).json({
        error: {
          code: 'CREATE_TEMPLATE_FAILED',
          message: `Failed to create template: ${(error as Error).message}`,
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Get prompt history for a project
   */
  async getHistory(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;
      const { assetId, limit, offset } = req.query;
      
      const validatedRequest = GetPromptHistoryRequestSchema.parse({
        projectId,
        assetId: assetId as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined
      });

      const history = await promptManagementService.getPromptHistory(
        validatedRequest.projectId,
        validatedRequest.assetId
      );

      // Apply pagination
      const startIndex = validatedRequest.offset || 0;
      const endIndex = startIndex + (validatedRequest.limit || 50);
      const paginatedHistory = history.slice(startIndex, endIndex);
      const hasMore = endIndex < history.length;

      res.status(200).json({
        history: paginatedHistory,
        total: history.length,
        hasMore
      });
    } catch (error) {
      console.error('Failed to get prompt history:', error);
      res.status(500).json({
        error: {
          code: 'GET_HISTORY_FAILED',
          message: `Failed to get history: ${(error as Error).message}`,
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Score prompt quality and provide feedback
   */
  async scorePrompt(req: Request, res: Response): Promise<void> {
    try {
      const validatedRequest = GeneratePromptSuggestionsRequestSchema.parse(req.body);
      
      const result = await promptManagementService.scorePrompt(
        validatedRequest.prompt,
        validatedRequest.projectId,
        validatedRequest.assetType,
        validatedRequest.aiConfig
      );

      res.status(200).json(result);
    } catch (error) {
      console.error('Failed to score prompt:', error);
      res.status(500).json({
        error: {
          code: 'SCORE_FAILED',
          message: `Failed to score prompt: ${(error as Error).message}`,
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Save prompt to history
   */
  async saveHistory(req: Request, res: Response): Promise<void> {
    try {
      const validatedRequest = SavePromptHistoryRequestSchema.parse(req.body);
      
      const history = await promptManagementService.savePromptHistory(
        validatedRequest.projectId,
        validatedRequest.originalPrompt,
        validatedRequest.enhancedPrompt,
        validatedRequest.assetId,
        validatedRequest.metadata
      );

      res.status(201).json({
        history
      });
    } catch (error) {
      console.error('Failed to save prompt history:', error);
      res.status(500).json({
        error: {
          code: 'SAVE_HISTORY_FAILED',
          message: `Failed to save history: ${(error as Error).message}`,
          timestamp: new Date().toISOString()
        }
      });
    }
  }
}

// Export singleton instance
export const promptController = new PromptController();