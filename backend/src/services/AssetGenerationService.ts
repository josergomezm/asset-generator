import { Asset, GenerationJob, Project } from '@asset-tool/types';
import { assetService } from './AssetService';
import { generationJobService } from './GenerationJobService';
import { projectService } from './ProjectService';
import { openAIService } from './ai/OpenAIService';
import { googleAIService } from './ai/GoogleAIService';
import { fileManager } from './FileManager';
import { promptManagementService } from './PromptManagementService';
import path from 'path';

export interface AIConfig {
  provider: string;
  model: string;
  apiKey: string;
  // Google AI specific options
  temperature?: number;
  maxOutputTokens?: number;
  topP?: number;
  topK?: number;
}

export interface GenerationRequest {
  projectId: string;
  type: Asset['type'];
  name: string;
  description?: string;
  generationPrompt: string;
  generationParameters?: Record<string, any>;
  styleOverride?: {
    description?: string;
    keywords?: string[];
  };
  aiConfig?: AIConfig;
}

export class AssetGenerationService {
  /**
   * Start asset generation process
   */
  async generateAsset(request: GenerationRequest): Promise<{ asset: Asset; job: GenerationJob }> {
    try {
      // Get project to access art style
      const project = await projectService.getProjectById(request.projectId);
      if (!project) {
        throw new Error(`Project ${request.projectId} not found`);
      }

      // Create asset with pending status
      const asset = await assetService.createAsset({
        projectId: request.projectId,
        type: request.type,
        name: request.name,
        description: request.description,
        generationPrompt: request.generationPrompt,
        generationParameters: request.generationParameters || {},
        styleOverride: request.styleOverride,
        status: 'pending',
        metadata: {}
      });

      // Create generation job
      const job = await generationJobService.createJob({
        assetId: asset.id,
        status: 'queued',
        progress: 0
      });

      // Queue the generation (this will be processed asynchronously)
      // Use enhanced process for better Google AI integration and history tracking
      this.processGenerationJobWithHistory(job.id, project, request).catch(error => {
        console.error(`Failed to process generation job ${job.id}:`, error);
        // Update job status to failed
        generationJobService.updateJob(job.id, {
          status: 'failed',
          progress: 0,
          errorMessage: (error as Error).message
        }).catch(updateError => {
          console.error(`Failed to update job status for ${job.id}:`, updateError);
        });
      });

      return { asset, job };
    } catch (error) {
      console.error('Failed to start asset generation:', error);
      throw new Error(`Failed to start asset generation: ${(error as Error).message}`);
    }
  }

  /**
   * Get generation status for an asset
   */
  async getGenerationStatus(assetId: string): Promise<GenerationJob | null> {
    try {
      const jobs = await generationJobService.getJobsByAssetId(assetId);
      // Return the most recent job for this asset
      return jobs.length > 0 ? jobs[jobs.length - 1] : null;
    } catch (error) {
      console.error(`Failed to get generation status for asset ${assetId}:`, error);
      return null;
    }
  }

  /**
   * Get generation job by ID
   */
  async getGenerationJob(jobId: string): Promise<GenerationJob | null> {
    try {
      return await generationJobService.getJobById(jobId);
    } catch (error) {
      console.error(`Failed to get generation job ${jobId}:`, error);
      return null;
    }
  }

  /**
   * Cancel generation job
   */
  async cancelGeneration(jobId: string): Promise<boolean> {
    try {
      const job = await generationJobService.getJobById(jobId);
      if (!job) {
        return false;
      }

      // Only allow cancellation of queued or processing jobs
      if (job.status !== 'queued' && job.status !== 'processing') {
        return false;
      }

      // Update job status to failed with cancellation message
      await generationJobService.updateJob(jobId, {
        status: 'failed',
        errorMessage: 'Generation cancelled by user'
      });

      // Update associated asset status
      await assetService.updateAsset(job.assetId, {
        status: 'failed'
      });

      return true;
    } catch (error) {
      console.error(`Failed to cancel generation job ${jobId}:`, error);
      return false;
    }
  }

  /**
   * Process generation job with AI integration
   */
  private async processGenerationJob(
    jobId: string,
    project: Project,
    request: GenerationRequest
  ): Promise<void> {
    try {
      // Update job status to processing
      await generationJobService.updateJob(jobId, {
        status: 'processing',
        progress: 10
      });

      // Update asset status to generating
      const job = await generationJobService.getJobById(jobId);
      if (!job) {
        throw new Error(`Job ${jobId} not found`);
      }

      await assetService.updateAsset(job.assetId, {
        status: 'generating'
      });

      // Build enhanced prompt with art style and AI enhancement
      const enhancedPrompt = await this.buildEnhancedPromptWithAI(
        request.generationPrompt,
        project,
        request.styleOverride,
        request.aiConfig,
        request.type
      );

      // Update progress
      await generationJobService.updateJob(jobId, {
        progress: 30
      });

      // Check if AI configuration is provided
      if (request.aiConfig) {
        // Use actual AI generation
        await this.performAIGeneration(jobId, enhancedPrompt, request.type, request.aiConfig);
      } else {
        // Fall back to simulation if no AI config provided
        await this.simulateGeneration(jobId, enhancedPrompt, request.type);
      }

      // Update job status to completed
      await generationJobService.updateJob(jobId, {
        status: 'completed',
        progress: 100
      });

      // Update asset status to completed
      await assetService.updateAsset(job.assetId, {
        status: 'completed',
        generationPrompt: enhancedPrompt
      });

    } catch (error) {
      console.error(`Generation job ${jobId} failed:`, error);

      // Update job status to failed
      await generationJobService.updateJob(jobId, {
        status: 'failed',
        progress: 0,
        errorMessage: (error as Error).message
      });

      // Update asset status to failed
      const job = await generationJobService.getJobById(jobId);
      if (job) {
        await assetService.updateAsset(job.assetId, {
          status: 'failed'
        });
      }
    }
  }

  /**
   * Build enhanced prompt incorporating project art style
   */
  private buildEnhancedPrompt(
    basePrompt: string,
    project: Project,
    styleOverride?: { description?: string; keywords?: string[] }
  ): string {
    let enhancedPrompt = basePrompt;

    // Use style override if provided, otherwise use project art style
    const styleDescription = styleOverride?.description || project.artStyle?.description;
    const styleKeywords = styleOverride?.keywords || project.artStyle?.styleKeywords;

    if (styleDescription) {
      enhancedPrompt += ` Style: ${styleDescription}`;
    }

    if (styleKeywords && styleKeywords.length > 0) {
      enhancedPrompt += ` Keywords: ${styleKeywords.join(', ')}`;
    }

    return enhancedPrompt;
  }

  /**
   * Build enhanced prompt with AI assistance for better generation results
   */
  private async buildEnhancedPromptWithAI(
    basePrompt: string,
    project: Project,
    styleOverride?: { description?: string; keywords?: string[] },
    aiConfig?: AIConfig,
    assetType?: Asset['type']
  ): Promise<string> {
    // Start with basic style enhancement
    const basicEnhancedPrompt = this.buildEnhancedPrompt(basePrompt, project, styleOverride);

    // If Google AI is configured and available, use it for further enhancement
    if (aiConfig?.provider === 'google' && aiConfig.apiKey) {
      try {
        console.log(`[AssetGeneration] Using Google AI to enhance prompt for ${assetType} generation`);
        
        const styleDescription = styleOverride?.description || project.artStyle?.description;
        const styleKeywords = styleOverride?.keywords || project.artStyle?.styleKeywords;

        const enhancedResponse = await googleAIService.enhancePrompt(
          basicEnhancedPrompt,
          {
            apiKey: aiConfig.apiKey,
            model: aiConfig.model || 'gemini-pro'
          },
          {
            assetType,
            artStyle: styleDescription,
            styleKeywords
          }
        );

        console.log(`[AssetGeneration] Google AI enhanced prompt: ${enhancedResponse.text.substring(0, 200)}...`);
        return enhancedResponse.text;
      } catch (error) {
        console.warn(`[AssetGeneration] Google AI enhancement failed, using basic enhancement:`, error);
        return basicEnhancedPrompt;
      }
    }

    return basicEnhancedPrompt;
  }

  /**
   * Generate prompt suggestions using Google AI
   */
  async generatePromptSuggestions(
    basePrompt: string,
    projectId: string,
    aiConfig: AIConfig,
    options?: {
      assetType?: Asset['type'];
      count?: number;
    }
  ): Promise<string[]> {
    try {
      const project = await projectService.getProjectById(projectId);
      if (!project) {
        throw new Error(`Project ${projectId} not found`);
      }

      if (aiConfig.provider !== 'google') {
        throw new Error('Prompt suggestions currently only supported with Google AI');
      }

      console.log(`[AssetGeneration] Generating ${options?.count || 3} prompt suggestions using Google AI`);

      const suggestions = await googleAIService.generatePromptSuggestions(
        basePrompt,
        {
          apiKey: aiConfig.apiKey,
          model: aiConfig.model || 'gemini-pro'
        },
        {
          assetType: options?.assetType,
          artStyle: project.artStyle?.description,
          count: options?.count || 3
        }
      );

      console.log(`[AssetGeneration] Generated ${suggestions?.length || 0} prompt suggestions`);
      return suggestions || [];
    } catch (error) {
      console.error('[AssetGeneration] Failed to generate prompt suggestions:', error);
      throw error;
    }
  }

  /**
   * Score prompt quality using Google AI
   */
  async scorePrompt(
    prompt: string,
    projectId: string,
    aiConfig: AIConfig,
    assetType?: Asset['type']
  ): Promise<{
    score: number;
    feedback: string;
    suggestions: string[];
  }> {
    try {
      const project = await projectService.getProjectById(projectId);
      if (!project) {
        throw new Error(`Project ${projectId} not found`);
      }

      if (aiConfig.provider !== 'google') {
        throw new Error('Prompt scoring currently only supported with Google AI');
      }

      console.log(`[AssetGeneration] Scoring prompt quality using Google AI`);

      const scoreResult = await googleAIService.scorePrompt(
        prompt,
        {
          apiKey: aiConfig.apiKey,
          model: aiConfig.model || 'gemini-pro'
        },
        {
          assetType,
          artStyle: project.artStyle?.description
        }
      );

      console.log(`[AssetGeneration] Prompt scored: ${scoreResult.score}/100`);
      return scoreResult;
    } catch (error) {
      console.error('[AssetGeneration] Failed to score prompt:', error);
      throw error;
    }
  }

  /**
   * Perform actual AI generation using configured provider
   */
  private async performAIGeneration(
    jobId: string,
    prompt: string,
    type: Asset['type'],
    aiConfig: AIConfig
  ): Promise<void> {
    console.log(`Starting AI generation for job ${jobId} using ${aiConfig.provider}/${aiConfig.model}`);

    try {
      switch (aiConfig.provider) {
        case 'openai':
          await this.generateWithOpenAI(jobId, prompt, type, aiConfig);
          break;
        case 'stability':
          await this.generateWithStabilityAI(jobId, prompt, type, aiConfig);
          break;
        case 'replicate':
          await this.generateWithReplicate(jobId, prompt, type, aiConfig);
          break;
        case 'anthropic':
          await this.generateWithAnthropic(jobId, prompt, type, aiConfig);
          break;
        case 'google':
          await this.generateWithGoogleAI(jobId, prompt, type, aiConfig);
          break;
        default:
          throw new Error(`Unsupported AI provider: ${aiConfig.provider}`);
      }
    } catch (error) {
      console.error(`AI generation failed for job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Generate using OpenAI APIs
   */
  private async generateWithOpenAI(
    jobId: string,
    prompt: string,
    type: Asset['type'],
    aiConfig: AIConfig
  ): Promise<void> {
    // Update progress
    await generationJobService.updateJob(jobId, { progress: 40 });

    try {
      if (type === 'image') {
        console.log(`Generating image with DALL-E model ${aiConfig.model}: ${prompt}`);
        const imageUrl = await openAIService.generateImage(prompt, {
          apiKey: aiConfig.apiKey,
          model: aiConfig.model
        });

        // TODO: Download and save the image to the asset files directory
        console.log(`Generated image URL: ${imageUrl}`);

      } else if (type === 'prompt') {
        console.log(`Enhancing prompt with GPT model ${aiConfig.model}: ${prompt}`);
        const enhancedPrompt = await openAIService.generateText(prompt, {
          apiKey: aiConfig.apiKey,
          model: aiConfig.model
        });

        // TODO: Save the enhanced prompt as a text file
        console.log(`Enhanced prompt: ${enhancedPrompt}`);
      }

      // Update progress
      await generationJobService.updateJob(jobId, { progress: 70 });
      await new Promise(resolve => setTimeout(resolve, 500));
      await generationJobService.updateJob(jobId, { progress: 90 });

    } catch (error) {
      console.error(`OpenAI generation failed for job ${jobId}:`, error);
      throw new Error(`OpenAI generation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Generate using Stability AI
   */
  private async generateWithStabilityAI(
    jobId: string,
    prompt: string,
    type: Asset['type'],
    aiConfig: AIConfig
  ): Promise<void> {
    await generationJobService.updateJob(jobId, { progress: 40 });

    if (type === 'image') {
      // TODO: Implement Stable Diffusion integration
      console.log(`Generating image with Stability AI model ${aiConfig.model}: ${prompt}`);
    } else if (type === 'video') {
      // TODO: Implement Stable Video Diffusion integration
      console.log(`Generating video with Stability AI model ${aiConfig.model}: ${prompt}`);
    }

    await generationJobService.updateJob(jobId, { progress: 70 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    await generationJobService.updateJob(jobId, { progress: 90 });
  }

  /**
   * Generate using Replicate
   */
  private async generateWithReplicate(
    jobId: string,
    prompt: string,
    type: Asset['type'],
    aiConfig: AIConfig
  ): Promise<void> {
    await generationJobService.updateJob(jobId, { progress: 40 });

    // TODO: Implement Replicate integration
    console.log(`Generating ${type} with Replicate model ${aiConfig.model}: ${prompt}`);

    await generationJobService.updateJob(jobId, { progress: 70 });
    await new Promise(resolve => setTimeout(resolve, 1500));
    await generationJobService.updateJob(jobId, { progress: 90 });
  }

  /**
   * Generate using Anthropic Claude
   */
  private async generateWithAnthropic(
    jobId: string,
    prompt: string,
    type: Asset['type'],
    aiConfig: AIConfig
  ): Promise<void> {
    await generationJobService.updateJob(jobId, { progress: 40 });

    if (type === 'prompt') {
      // TODO: Implement Claude integration for prompt enhancement
      console.log(`Enhancing prompt with Claude model ${aiConfig.model}: ${prompt}`);
    }

    await generationJobService.updateJob(jobId, { progress: 70 });
    await new Promise(resolve => setTimeout(resolve, 800));
    await generationJobService.updateJob(jobId, { progress: 90 });
  }

  /**
   * Generate using Google AI (Gemini)
   */
  private async generateWithGoogleAI(
    jobId: string,
    prompt: string,
    type: Asset['type'],
    aiConfig: AIConfig
  ): Promise<void> {
    // Update progress
    await generationJobService.updateJob(jobId, { progress: 40 });

    try {
      if (type === 'prompt') {
        console.log(`Generating enhanced prompt with Google AI model ${aiConfig.model}: ${prompt.substring(0, 100)}...`);
        
        const enhancedResponse = await googleAIService.generateText(
          `Please create an enhanced version of this prompt for AI image generation: "${prompt}"`,
          {
            apiKey: aiConfig.apiKey,
            model: aiConfig.model || 'gemini-pro'
          },
          {
            temperature: aiConfig.temperature || 0.7,
            maxOutputTokens: aiConfig.maxOutputTokens || 800,
            topP: aiConfig.topP,
            topK: aiConfig.topK
          }
        );

        // Get the job to access asset ID
        const job = await generationJobService.getJobById(jobId);
        if (job) {
          // Save the enhanced prompt as a text file
          const filePath = await this.savePromptToFile(job.assetId, enhancedResponse.text);
          
          // Update asset with file path and metadata
          await assetService.updateAsset(job.assetId, {
            generationPrompt: enhancedResponse.text,
            filePath,
            metadata: {
              ...((await assetService.getAssetById(job.assetId))?.metadata || {}),
              format: 'txt',
              fileSize: Buffer.byteLength(enhancedResponse.text, 'utf8'),
              googleAI: {
                model: aiConfig.model,
                finishReason: enhancedResponse.finishReason,
                safetyRatings: enhancedResponse.safetyRatings
              }
            }
          });
        }

        console.log(`Generated enhanced prompt: ${enhancedResponse.text.substring(0, 200)}...`);
      } else {
        // For image and video generation, Google AI doesn't directly generate media
        // but we can use it to enhance the prompt before passing to other services
        console.log(`Google AI enhanced prompt for ${type} generation: ${prompt.substring(0, 100)}...`);
        
        // TODO: Integrate with actual image/video generation services
        // For now, we'll simulate the generation process
      }

      // Update progress
      await generationJobService.updateJob(jobId, { progress: 70 });
      await new Promise(resolve => setTimeout(resolve, 1000));
      await generationJobService.updateJob(jobId, { progress: 90 });

    } catch (error) {
      console.error(`Google AI generation failed for job ${jobId}:`, error);
      throw new Error(`Google AI generation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Simulate generation process (fallback when no AI config provided)
   */
  private async simulateGeneration(
    jobId: string,
    prompt: string,
    type: Asset['type']
  ): Promise<void> {
    // Simulate different generation times based on asset type
    let steps: number[];
    let delay: number;

    switch (type) {
      case 'video':
        steps = [20, 40, 60, 80, 90];
        delay = 2000; // Videos take longer
        break;
      case 'prompt':
        steps = [30, 60, 90]; // Prompts are faster
        delay = 500;
        break;
      default: // image
        steps = [50, 70, 90];
        delay = 1000;
        break;
    }

    for (const progress of steps) {
      await new Promise(resolve => setTimeout(resolve, delay));
      await generationJobService.updateJob(jobId, { progress });
    }

    // TODO: Replace this with actual AI generation logic
    // This would involve:
    // 1. Calling external AI APIs (OpenAI GPT for prompts, Stability AI for images, RunwayML for video, etc.)
    // 2. Handling file uploads and storage
    // 3. Processing generated content
    // 4. Saving files to the asset files directory
    // 5. For videos: handling video-specific parameters like duration, fps, resolution
    // 6. For prompts: generating enhanced text prompts and storing as text files

    console.log(`Simulated ${type} generation completed for job ${jobId} with prompt: ${prompt}`);
  }

  /**
   * Get all active generation jobs
   */
  async getActiveJobs(): Promise<GenerationJob[]> {
    try {
      const queuedJobs = await generationJobService.getJobsByStatus('queued');
      const processingJobs = await generationJobService.getJobsByStatus('processing');
      return [...queuedJobs, ...processingJobs];
    } catch (error) {
      console.error('Failed to get active jobs:', error);
      return [];
    }
  }

  /**
   * Clean up old completed jobs
   */
  async cleanupOldJobs(daysOld: number = 30): Promise<number> {
    try {
      return await generationJobService.cleanupOldJobs(daysOld);
    } catch (error) {
      console.error('Failed to cleanup old jobs:', error);
      return 0;
    }
  }

  /**
   * Save prompt content to file
   */
  private async savePromptToFile(assetId: string, promptContent: string): Promise<string> {
    try {
      // Create assets directory structure
      const assetsDir = path.join('assets', assetId);
      await fileManager.ensureDirectoryExists(assetsDir);
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `prompt-${timestamp}.txt`;
      const filePath = path.join(assetsDir, filename);
      
      // Write prompt content to file
      await fileManager.writeFile(filePath, promptContent);
      
      console.log(`[AssetGeneration] Saved prompt to file: ${filePath}`);
      return filePath;
    } catch (error) {
      console.error(`[AssetGeneration] Failed to save prompt to file:`, error);
      throw error;
    }
  }

  /**
   * Delegate to prompt management service for breakdown
   */
  async breakdownPrompt(
    prompt: string,
    projectId?: string,
    assetType?: Asset['type'],
    aiConfig?: AIConfig
  ): Promise<any> {
    return await promptManagementService.breakdownPrompt(prompt, projectId, assetType, aiConfig);
  }

  /**
   * Enhanced processGenerationJob with Google AI integration and history tracking
   */
  private async processGenerationJobWithHistory(
    jobId: string,
    project: Project,
    request: GenerationRequest
  ): Promise<void> {
    const originalPrompt = request.generationPrompt;
    let enhancedPrompt = originalPrompt;
    
    try {
      // Update job status to processing
      await generationJobService.updateJob(jobId, {
        status: 'processing',
        progress: 10
      });

      // Update asset status to generating
      const job = await generationJobService.getJobById(jobId);
      if (!job) {
        throw new Error(`Job ${jobId} not found`);
      }

      await assetService.updateAsset(job.assetId, {
        status: 'generating'
      });

      // Build enhanced prompt with AI assistance
      enhancedPrompt = await this.buildEnhancedPromptWithAI(
        request.generationPrompt,
        project,
        request.styleOverride,
        request.aiConfig,
        request.type
      );

      // Save to prompt history
      await promptManagementService.savePromptHistory(
        project.id,
        originalPrompt,
        enhancedPrompt,
        job.assetId,
        {
          aiProvider: request.aiConfig?.provider,
          aiModel: request.aiConfig?.model,
          enhancementType: request.aiConfig ? 'ai' : 'manual'
        }
      );

      // Update progress
      await generationJobService.updateJob(jobId, {
        progress: 30
      });

      // Perform generation based on AI configuration
      if (request.aiConfig) {
        await this.performAIGeneration(jobId, enhancedPrompt, request.type, request.aiConfig);
      } else {
        await this.simulateGeneration(jobId, enhancedPrompt, request.type);
      }

      // Update job status to completed
      await generationJobService.updateJob(jobId, {
        status: 'completed',
        progress: 100
      });

      // Update asset status to completed with enhanced prompt
      await assetService.updateAsset(job.assetId, {
        status: 'completed',
        generationPrompt: enhancedPrompt
      });

      console.log(`[AssetGeneration] Successfully completed generation job ${jobId}`);

    } catch (error) {
      console.error(`Generation job ${jobId} failed:`, error);

      // Update job status to failed
      await generationJobService.updateJob(jobId, {
        status: 'failed',
        progress: 0,
        errorMessage: (error as Error).message
      });

      // Update asset status to failed
      const job = await generationJobService.getJobById(jobId);
      if (job) {
        await assetService.updateAsset(job.assetId, {
          status: 'failed'
        });
      }

      // Still save to history even if generation failed
      try {
        await promptManagementService.savePromptHistory(
          project.id,
          originalPrompt,
          enhancedPrompt,
          job?.assetId,
          {
            aiProvider: request.aiConfig?.provider,
            aiModel: request.aiConfig?.model,
            enhancementType: request.aiConfig ? 'ai' : 'manual',
            feedback: `Generation failed: ${(error as Error).message}`
          }
        );
      } catch (historyError) {
        console.error('Failed to save prompt history after generation failure:', historyError);
      }
    }
  }
}

// Export singleton instance
export const assetGenerationService = new AssetGenerationService();