import { Request, Response } from 'express';
import { assetGenerationService } from '../services/AssetGenerationService';
import { z } from 'zod';

export class GenerationController {
  /**
   * Generate image asset
   */
  async generateImage(req: Request, res: Response): Promise<void> {
    try {
      const {
        projectId,
        name,
        description,
        generationPrompt,
        generationParameters,
        styleOverride
      } = req.body;

      const result = await assetGenerationService.generateAsset({
        projectId,
        type: 'image',
        name,
        description,
        generationPrompt,
        generationParameters,
        styleOverride
      });

      res.status(201).json({
        asset: result.asset,
        job: result.job,
        message: 'Image generation started successfully'
      });
    } catch (error) {
      console.error('Failed to generate image:', error);
      
      if ((error as Error).message.includes('not found')) {
        res.status(404).json({
          error: {
            code: 'PROJECT_NOT_FOUND',
            message: 'Project not found',
            timestamp: new Date().toISOString()
          }
        });
        return;
      }

      res.status(500).json({
        error: {
          code: 'GENERATION_FAILED',
          message: 'Failed to start image generation',
          details: (error as Error).message,
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Generate video asset
   */
  async generateVideo(req: Request, res: Response): Promise<void> {
    try {
      const {
        projectId,
        name,
        description,
        generationPrompt,
        generationParameters,
        styleOverride
      } = req.body;

      const result = await assetGenerationService.generateAsset({
        projectId,
        type: 'video',
        name,
        description,
        generationPrompt,
        generationParameters,
        styleOverride
      });

      res.status(201).json({
        asset: result.asset,
        job: result.job,
        message: 'Video generation started successfully'
      });
    } catch (error) {
      console.error('Failed to generate video:', error);
      
      if ((error as Error).message.includes('not found')) {
        res.status(404).json({
          error: {
            code: 'PROJECT_NOT_FOUND',
            message: 'Project not found',
            timestamp: new Date().toISOString()
          }
        });
        return;
      }

      res.status(500).json({
        error: {
          code: 'GENERATION_FAILED',
          message: 'Failed to start video generation',
          details: (error as Error).message,
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Generate prompt asset
   */
  async generatePrompt(req: Request, res: Response): Promise<void> {
    try {
      const {
        projectId,
        name,
        description,
        generationPrompt,
        generationParameters,
        styleOverride
      } = req.body;

      const result = await assetGenerationService.generateAsset({
        projectId,
        type: 'prompt',
        name,
        description,
        generationPrompt,
        generationParameters,
        styleOverride
      });

      res.status(201).json({
        asset: result.asset,
        job: result.job,
        message: 'Prompt generation started successfully'
      });
    } catch (error) {
      console.error('Failed to generate prompt:', error);
      
      if ((error as Error).message.includes('not found')) {
        res.status(404).json({
          error: {
            code: 'PROJECT_NOT_FOUND',
            message: 'Project not found',
            timestamp: new Date().toISOString()
          }
        });
        return;
      }

      res.status(500).json({
        error: {
          code: 'GENERATION_FAILED',
          message: 'Failed to start prompt generation',
          details: (error as Error).message,
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Get generation status by job ID
   */
  async getGenerationStatus(req: Request, res: Response): Promise<void> {
    try {
      const { jobId } = req.params;

      const job = await assetGenerationService.getGenerationJob(jobId);

      if (!job) {
        res.status(404).json({
          error: {
            code: 'JOB_NOT_FOUND',
            message: 'Generation job not found',
            timestamp: new Date().toISOString()
          }
        });
        return;
      }

      res.json({
        job,
        message: 'Generation status retrieved successfully'
      });
    } catch (error) {
      console.error('Failed to get generation status:', error);
      
      res.status(500).json({
        error: {
          code: 'STATUS_CHECK_FAILED',
          message: 'Failed to check generation status',
          details: (error as Error).message,
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Cancel generation job
   */
  async cancelGeneration(req: Request, res: Response): Promise<void> {
    try {
      const { jobId } = req.params;

      const success = await assetGenerationService.cancelGeneration(jobId);

      if (!success) {
        res.status(404).json({
          error: {
            code: 'JOB_NOT_FOUND_OR_NOT_CANCELLABLE',
            message: 'Generation job not found or cannot be cancelled',
            timestamp: new Date().toISOString()
          }
        });
        return;
      }

      res.json({
        message: 'Generation job cancelled successfully'
      });
    } catch (error) {
      console.error('Failed to cancel generation:', error);
      
      res.status(500).json({
        error: {
          code: 'CANCELLATION_FAILED',
          message: 'Failed to cancel generation job',
          details: (error as Error).message,
          timestamp: new Date().toISOString()
        }
      });
    }
  }
}