import { Asset, GenerationJob, Project } from '@asset-tool/types';
import { assetService } from './AssetService';
import { generationJobService } from './GenerationJobService';
import { projectService } from './ProjectService';

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
      this.processGenerationJob(job.id, project, request).catch(error => {
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
   * Process generation job (placeholder for actual AI integration)
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

      // Build enhanced prompt with art style
      const enhancedPrompt = this.buildEnhancedPrompt(
        request.generationPrompt,
        project,
        request.styleOverride
      );

      // Update progress
      await generationJobService.updateJob(jobId, {
        progress: 30
      });

      // TODO: This is where actual AI generation would happen
      // For now, we'll simulate the process
      await this.simulateGeneration(jobId, enhancedPrompt, request.type);

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
   * Simulate generation process (placeholder for actual AI integration)
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
}

// Export singleton instance
export const assetGenerationService = new AssetGenerationService();