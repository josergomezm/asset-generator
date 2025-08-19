import { AssetGenerationService } from '../../services/AssetGenerationService';
import { assetService } from '../../services/AssetService';
import { generationJobService } from '../../services/GenerationJobService';
import { projectService } from '../../services/ProjectService';
import { fileManager } from '../../services/FileManager';

// Mock the services
jest.mock('../../services/AssetService');
jest.mock('../../services/GenerationJobService');
jest.mock('../../services/ProjectService');

const mockAssetService = assetService as jest.Mocked<typeof assetService>;
const mockGenerationJobService = generationJobService as jest.Mocked<typeof generationJobService>;
const mockProjectService = projectService as jest.Mocked<typeof projectService>;

describe('AssetGenerationService', () => {
  let service: AssetGenerationService;

  beforeEach(() => {
    service = new AssetGenerationService();
    jest.clearAllMocks();
  });

  describe('generateAsset', () => {
    it('should create asset and generation job successfully', async () => {
      // Mock project
      const mockProject = {
        id: 'project-1',
        name: 'Test Project',
        description: 'Test description',
        context: 'Test context',
        artStyle: {
          description: 'Modern minimalist style',
          referenceImages: [],
          styleKeywords: ['modern', 'minimalist']
        },
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      };

      // Mock asset
      const mockAsset = {
        id: 'asset-1',
        projectId: 'project-1',
        type: 'image' as const,
        name: 'Test Asset',
        description: 'Test asset description',
        generationPrompt: 'A beautiful landscape',
        generationParameters: {},
        status: 'pending' as const,
        createdAt: '2023-01-01T00:00:00.000Z',
        metadata: {}
      };

      // Mock generation job
      const mockJob = {
        id: 'job-1',
        assetId: 'asset-1',
        status: 'queued' as const,
        progress: 0,
        createdAt: '2023-01-01T00:00:00.000Z'
      };

      // Setup mocks
      mockProjectService.getProjectById.mockResolvedValue(mockProject);
      mockAssetService.createAsset.mockResolvedValue(mockAsset);
      mockGenerationJobService.createJob.mockResolvedValue(mockJob);

      const request = {
        projectId: 'project-1',
        type: 'image' as const,
        name: 'Test Asset',
        description: 'Test asset description',
        generationPrompt: 'A beautiful landscape',
        generationParameters: {}
      };

      const result = await service.generateAsset(request);

      expect(result.asset).toEqual(mockAsset);
      expect(result.job).toEqual(mockJob);
      expect(mockProjectService.getProjectById).toHaveBeenCalledWith('project-1');
      expect(mockAssetService.createAsset).toHaveBeenCalledWith({
        projectId: 'project-1',
        type: 'image',
        name: 'Test Asset',
        description: 'Test asset description',
        generationPrompt: 'A beautiful landscape',
        generationParameters: {},
        status: 'pending',
        metadata: {}
      });
      expect(mockGenerationJobService.createJob).toHaveBeenCalledWith({
        assetId: 'asset-1',
        status: 'queued',
        progress: 0
      });
    });

    it('should throw error if project not found', async () => {
      mockProjectService.getProjectById.mockResolvedValue(null);

      const request = {
        projectId: 'non-existent-project',
        type: 'image' as const,
        name: 'Test Asset',
        generationPrompt: 'A beautiful landscape'
      };

      await expect(service.generateAsset(request)).rejects.toThrow('Project non-existent-project not found');
    });
  });

  describe('getGenerationStatus', () => {
    it('should return the most recent job for an asset', async () => {
      const mockJobs = [
        {
          id: 'job-1',
          assetId: 'asset-1',
          status: 'completed' as const,
          progress: 100,
          createdAt: '2023-01-01T00:00:00.000Z'
        },
        {
          id: 'job-2',
          assetId: 'asset-1',
          status: 'processing' as const,
          progress: 50,
          createdAt: '2023-01-01T01:00:00.000Z'
        }
      ];

      mockGenerationJobService.getJobsByAssetId.mockResolvedValue(mockJobs);

      const result = await service.getGenerationStatus('asset-1');

      expect(result).toEqual(mockJobs[1]); // Should return the most recent job
      expect(mockGenerationJobService.getJobsByAssetId).toHaveBeenCalledWith('asset-1');
    });

    it('should return null if no jobs found', async () => {
      mockGenerationJobService.getJobsByAssetId.mockResolvedValue([]);

      const result = await service.getGenerationStatus('asset-1');

      expect(result).toBeNull();
    });
  });

  describe('cancelGeneration', () => {
    it('should cancel a queued job successfully', async () => {
      const mockJob = {
        id: 'job-1',
        assetId: 'asset-1',
        status: 'queued' as const,
        progress: 0,
        createdAt: '2023-01-01T00:00:00.000Z'
      };

      mockGenerationJobService.getJobById.mockResolvedValue(mockJob);
      mockGenerationJobService.updateJob.mockResolvedValue({
        ...mockJob,
        status: 'failed',
        errorMessage: 'Generation cancelled by user'
      });
      mockAssetService.updateAsset.mockResolvedValue({
        id: 'asset-1',
        projectId: 'project-1',
        type: 'image',
        name: 'Test Asset',
        generationPrompt: 'Test prompt',
        generationParameters: {},
        status: 'failed',
        createdAt: '2023-01-01T00:00:00.000Z',
        metadata: {}
      });

      const result = await service.cancelGeneration('job-1');

      expect(result).toBe(true);
      expect(mockGenerationJobService.updateJob).toHaveBeenCalledWith('job-1', {
        status: 'failed',
        errorMessage: 'Generation cancelled by user'
      });
      expect(mockAssetService.updateAsset).toHaveBeenCalledWith('asset-1', {
        status: 'failed'
      });
    });

    it('should not cancel a completed job', async () => {
      const mockJob = {
        id: 'job-1',
        assetId: 'asset-1',
        status: 'completed' as const,
        progress: 100,
        createdAt: '2023-01-01T00:00:00.000Z'
      };

      mockGenerationJobService.getJobById.mockResolvedValue(mockJob);

      const result = await service.cancelGeneration('job-1');

      expect(result).toBe(false);
      expect(mockGenerationJobService.updateJob).not.toHaveBeenCalled();
      expect(mockAssetService.updateAsset).not.toHaveBeenCalled();
    });
  });
});