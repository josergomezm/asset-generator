import { GenerationJob, GenerationJobSchema } from '@asset-tool/types';
import { fileManager } from './FileManager';

export class GenerationJobService {
  private jobsIndexPath = 'jobs/generation-jobs.json';

  /**
   * Get all generation jobs
   */
  async getAllJobs(): Promise<GenerationJob[]> {
    try {
      return await fileManager.readJSON<GenerationJob[]>(this.jobsIndexPath);
    } catch (error) {
      console.error('Failed to get all generation jobs:', error);
      return [];
    }
  }

  /**
   * Get generation job by ID
   */
  async getJobById(id: string): Promise<GenerationJob | null> {
    try {
      const jobs = await this.getAllJobs();
      const job = jobs.find(j => j.id === id);
      
      if (!job) {
        return null;
      }
      
      // Validate job data
      return GenerationJobSchema.parse(job);
    } catch (error) {
      console.error(`Failed to get generation job ${id}:`, error);
      return null;
    }
  }

  /**
   * Get jobs by asset ID
   */
  async getJobsByAssetId(assetId: string): Promise<GenerationJob[]> {
    try {
      const jobs = await this.getAllJobs();
      return jobs.filter(j => j.assetId === assetId);
    } catch (error) {
      console.error(`Failed to get jobs for asset ${assetId}:`, error);
      return [];
    }
  }

  /**
   * Get jobs by status
   */
  async getJobsByStatus(status: GenerationJob['status']): Promise<GenerationJob[]> {
    try {
      const jobs = await this.getAllJobs();
      return jobs.filter(j => j.status === status);
    } catch (error) {
      console.error(`Failed to get jobs with status ${status}:`, error);
      return [];
    }
  }

  /**
   * Create new generation job
   */
  async createJob(jobData: Omit<GenerationJob, 'id' | 'createdAt'>): Promise<GenerationJob> {
    try {
      const now = fileManager.getCurrentTimestamp();
      const job: GenerationJob = {
        ...jobData,
        id: fileManager.generateId(),
        createdAt: now
      };

      // Validate job data
      const validatedJob = GenerationJobSchema.parse(job);

      // Update jobs index
      await this.updateJobsIndex(validatedJob);

      return validatedJob;
    } catch (error) {
      console.error('Failed to create generation job:', error);
      throw new Error(`Failed to create generation job: ${(error as Error).message}`);
    }
  }

  /**
   * Update generation job
   */
  async updateJob(id: string, updates: Partial<Omit<GenerationJob, 'id' | 'assetId' | 'createdAt'>>): Promise<GenerationJob | null> {
    try {
      const existingJob = await this.getJobById(id);
      if (!existingJob) {
        return null;
      }

      const updatedJob: GenerationJob = {
        ...existingJob,
        ...updates,
        id: existingJob.id, // Ensure ID cannot be changed
        assetId: existingJob.assetId, // Ensure assetId cannot be changed
        createdAt: existingJob.createdAt // Ensure createdAt cannot be changed
      };

      // Set completedAt timestamp if status is completed or failed
      if ((updates.status === 'completed' || updates.status === 'failed') && !updatedJob.completedAt) {
        updatedJob.completedAt = fileManager.getCurrentTimestamp();
      }

      // Validate updated job data
      const validatedJob = GenerationJobSchema.parse(updatedJob);

      // Update jobs index
      await this.updateJobsIndex(validatedJob);

      return validatedJob;
    } catch (error) {
      console.error(`Failed to update generation job ${id}:`, error);
      throw new Error(`Failed to update generation job: ${(error as Error).message}`);
    }
  }

  /**
   * Delete generation job
   */
  async deleteJob(id: string): Promise<boolean> {
    try {
      const existingJob = await this.getJobById(id);
      if (!existingJob) {
        return false;
      }

      // Remove from jobs index
      await this.removeFromJobsIndex(id);

      return true;
    } catch (error) {
      console.error(`Failed to delete generation job ${id}:`, error);
      throw new Error(`Failed to delete generation job: ${(error as Error).message}`);
    }
  }

  /**
   * Clean up completed jobs older than specified days
   */
  async cleanupOldJobs(daysOld: number = 30): Promise<number> {
    try {
      const jobs = await this.getAllJobs();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const jobsToKeep = jobs.filter(job => {
        if (job.status === 'queued' || job.status === 'processing') {
          return true; // Keep active jobs
        }
        
        const completedAt = job.completedAt ? new Date(job.completedAt) : new Date(job.createdAt);
        return completedAt > cutoffDate;
      });

      const deletedCount = jobs.length - jobsToKeep.length;
      
      if (deletedCount > 0) {
        await fileManager.writeJSON(this.jobsIndexPath, jobsToKeep);
      }

      return deletedCount;
    } catch (error) {
      console.error('Failed to cleanup old jobs:', error);
      throw new Error(`Failed to cleanup old jobs: ${(error as Error).message}`);
    }
  }

  /**
   * Update jobs index with job data
   */
  private async updateJobsIndex(job: GenerationJob): Promise<void> {
    try {
      const jobs = await this.getAllJobs();
      const existingIndex = jobs.findIndex(j => j.id === job.id);
      
      if (existingIndex >= 0) {
        jobs[existingIndex] = job;
      } else {
        jobs.push(job);
      }

      await fileManager.writeJSON(this.jobsIndexPath, jobs);
    } catch (error) {
      console.error('Failed to update jobs index:', error);
      throw error;
    }
  }

  /**
   * Remove job from jobs index
   */
  private async removeFromJobsIndex(jobId: string): Promise<void> {
    try {
      const jobs = await this.getAllJobs();
      const filteredJobs = jobs.filter(j => j.id !== jobId);
      await fileManager.writeJSON(this.jobsIndexPath, filteredJobs);
    } catch (error) {
      console.error('Failed to remove job from index:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const generationJobService = new GenerationJobService();