import { AssetGenerationService } from '../../services/AssetGenerationService';
import { googleAIService } from '../../services/ai/GoogleAIService';
import { promptManagementService } from '../../services/PromptManagementService';
import { fileManager } from '../../services/FileManager';
import { assetService } from '../../services/AssetService';
import { generationJobService } from '../../services/GenerationJobService';
import { projectService } from '../../services/ProjectService';
import { Project, Asset, GenerationJob } from '@asset-tool/types';

// Mock all services
jest.mock('../../services/ai/GoogleAIService');
jest.mock('../../services/PromptManagementService');
jest.mock('../../services/FileManager');
jest.mock('../../services/AssetService');
jest.mock('../../services/GenerationJobService');
jest.mock('../../services/ProjectService');

const mockGoogleAIService = googleAIService as jest.Mocked<typeof googleAIService>;
const mockPromptManagementService = promptManagementService as jest.Mocked<typeof promptManagementService>;
const mockFileManager = fileManager as jest.Mocked<typeof fileManager>;
const mockAssetService = assetService as jest.Mocked<typeof assetService>;
const mockGenerationJobService = generationJobService as jest.Mocked<typeof generationJobService>;
const mockProjectService = projectService as jest.Mocked<typeof projectService>;

describe('AssetGenerationService - Google AI Integration', () => {
  let assetGenerationService: AssetGenerationService;
  let mockProject: Project;
  let mockAsset: Asset;
  let mockJob: GenerationJob;

  beforeEach(() => {
    assetGenerationService = new AssetGenerationService();
    
    mockProject = {
      id: 'test-project-id',
      name: 'Test Project',
      description: 'Test project for Google AI integration',
      context: 'Testing context',
      artStyle: {
        description: 'Modern minimalist style with clean lines',
        referenceImages: [],
        styleKeywords: ['minimalist', 'clean', 'modern']
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    mockAsset = {
      id: 'test-asset-id',
      projectId: mockProject.id,
      type: 'prompt',
      name: 'Test Prompt Asset',
      description: 'Test prompt asset',
      generationPrompt: 'A beautiful landscape',
      generationParameters: {},
      status: 'pending',
      createdAt: new Date().toISOString(),
      metadata: {}
    };

    mockJob = {
      id: 'test-job-id',
      assetId: mockAsset.id,
      status: 'queued',
      progress: 0,
      createdAt: new Date().toISOString()
    };

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('generateAsset with Google AI', () => {
    it('should generate prompt asset with Google AI enhancement and save to file', async () => {
      const generationRequest = {
        projectId: mockProject.id,
        type: 'prompt' as const,
        name: 'Enhanced Prompt',
        description: 'Test enhanced prompt generation',
        generationPrompt: 'A mountain landscape',
        aiConfig: {
          provider: 'google',
          model: 'gemini-pro',
          apiKey: 'test-api-key'
        }
      };

      const enhancedPrompt = 'A breathtaking mountain landscape with snow-capped peaks, dramatic lighting, and crystal clear alpine lake in the foreground, captured in modern minimalist style with clean composition';
      const filePath = 'assets/test-asset-id/prompt-2023-01-01T00-00-00-000Z.txt';

      // Setup mocks
      mockProjectService.getProjectById.mockResolvedValue(mockProject);
      mockAssetService.createAsset.mockResolvedValue(mockAsset);
      mockGenerationJobService.createJob.mockResolvedValue(mockJob);
      mockGenerationJobService.getJobById.mockResolvedValue(mockJob);
      mockGenerationJobService.updateJob.mockResolvedValue(mockJob);
      
      mockGoogleAIService.enhancePrompt.mockResolvedValue({
        text: enhancedPrompt,
        finishReason: 'STOP'
      });
      
      mockGoogleAIService.generateText.mockResolvedValue({
        text: enhancedPrompt,
        finishReason: 'STOP'
      });

      mockFileManager.ensureDirectoryExists.mockResolvedValue();
      mockFileManager.writeFile.mockResolvedValue();
      mockAssetService.updateAsset.mockResolvedValue(mockAsset);
      mockAssetService.getAssetById.mockResolvedValue(mockAsset);
      mockPromptManagementService.savePromptHistory.mockResolvedValue({
        id: 'history-id',
        projectId: mockProject.id,
        originalPrompt: generationRequest.generationPrompt,
        enhancedPrompt,
        version: 1,
        metadata: {
          aiProvider: 'google',
          aiModel: 'gemini-pro',
          enhancementType: 'ai'
        },
        createdAt: new Date().toISOString()
      });

      // Execute
      const result = await assetGenerationService.generateAsset(generationRequest);

      // Verify result
      expect(result.asset).toBeDefined();
      expect(result.job).toBeDefined();
      expect(result.asset.id).toBe(mockAsset.id);
      expect(result.job.id).toBe(mockJob.id);

      // Verify project was fetched
      expect(mockProjectService.getProjectById).toHaveBeenCalledWith(mockProject.id);

      // Verify asset was created
      expect(mockAssetService.createAsset).toHaveBeenCalledWith({
        projectId: mockProject.id,
        type: 'prompt',
        name: 'Enhanced Prompt',
        description: 'Test enhanced prompt generation',
        generationPrompt: 'A mountain landscape',
        generationParameters: {},
        status: 'pending',
        metadata: {}
      });

      // Verify job was created
      expect(mockGenerationJobService.createJob).toHaveBeenCalledWith({
        assetId: mockAsset.id,
        status: 'queued',
        progress: 0
      });

      // Allow async processing to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify Google AI was called for enhancement
      expect(mockGoogleAIService.enhancePrompt).toHaveBeenCalledWith(
        expect.stringContaining('A mountain landscape'),
        { apiKey: 'test-api-key', model: 'gemini-pro' },
        {
          assetType: 'prompt',
          artStyle: mockProject.artStyle?.description,
          styleKeywords: mockProject.artStyle?.styleKeywords
        }
      );

      // Verify prompt history was saved
      expect(mockPromptManagementService.savePromptHistory).toHaveBeenCalledWith(
        mockProject.id,
        'A mountain landscape',
        enhancedPrompt,
        mockAsset.id,
        {
          aiProvider: 'google',
          aiModel: 'gemini-pro',
          enhancementType: 'ai'
        }
      );
    });

    it('should handle Google AI enhancement failure gracefully', async () => {
      const generationRequest = {
        projectId: mockProject.id,
        type: 'prompt' as const,
        name: 'Test Prompt',
        generationPrompt: 'A simple prompt',
        aiConfig: {
          provider: 'google',
          model: 'gemini-pro',
          apiKey: 'invalid-key'
        }
      };

      // Setup mocks
      mockProjectService.getProjectById.mockResolvedValue(mockProject);
      mockAssetService.createAsset.mockResolvedValue(mockAsset);
      mockGenerationJobService.createJob.mockResolvedValue(mockJob);
      mockGenerationJobService.getJobById.mockResolvedValue(mockJob);
      mockGenerationJobService.updateJob.mockResolvedValue(mockJob);
      
      // Mock Google AI failure
      mockGoogleAIService.enhancePrompt.mockRejectedValue(new Error('API key invalid'));
      
      mockAssetService.updateAsset.mockResolvedValue(mockAsset);
      mockPromptManagementService.savePromptHistory.mockResolvedValue({
        id: 'history-id',
        projectId: mockProject.id,
        originalPrompt: generationRequest.generationPrompt,
        version: 1,
        metadata: {
          aiProvider: 'google',
          aiModel: 'gemini-pro',
          enhancementType: 'ai'
        },
        createdAt: new Date().toISOString()
      });

      // Execute
      const result = await assetGenerationService.generateAsset(generationRequest);

      // Should still return result (fallback to basic enhancement)
      expect(result.asset).toBeDefined();
      expect(result.job).toBeDefined();

      // Allow async processing to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify fallback behavior - should still save to history
      expect(mockPromptManagementService.savePromptHistory).toHaveBeenCalled();
    });
  });

  describe('savePromptToFile', () => {
    it('should save prompt content to file with proper structure', async () => {
      const assetId = 'test-asset-id';
      const promptContent = 'Enhanced prompt content for testing';

      mockFileManager.ensureDirectoryExists.mockResolvedValue();
      mockFileManager.writeFile.mockResolvedValue();

      // Access private method for testing
      const service = assetGenerationService as any;
      const filePath = await service.savePromptToFile(assetId, promptContent);

      // Verify directory creation (handle Windows path separators)
      expect(mockFileManager.ensureDirectoryExists).toHaveBeenCalledWith(
        expect.stringMatching(/assets[\/\\]test-asset-id/)
      );

      // Verify file write (handle Windows path separators)
      expect(mockFileManager.writeFile).toHaveBeenCalledWith(
        expect.stringMatching(/assets[\/\\]test-asset-id[\/\\]prompt-.*\.txt$/),
        promptContent
      );

      // Verify returned file path (handle Windows path separators)
      expect(filePath).toMatch(/assets[\/\\]test-asset-id[\/\\]prompt-.*\.txt$/);
    });
  });

  describe('integration with prompt management', () => {
    it('should integrate with prompt breakdown and suggestions', async () => {
      const prompt = 'A detailed landscape scene';
      const aiConfig = {
        provider: 'google',
        model: 'gemini-pro',
        apiKey: 'test-key'
      };

      // Test prompt breakdown
      const mockBreakdown = {
        id: 'breakdown-id',
        originalPrompt: prompt,
        components: [
          {
            id: 'comp-1',
            type: 'subject' as const,
            label: 'Main Subject',
            value: 'landscape scene',
            weight: 10
          }
        ],
        reconstructedPrompt: 'landscape scene',
        createdAt: new Date().toISOString()
      };

      const mockSuggestions = [
        'Add golden hour lighting for better visual appeal',
        'Include more specific composition details',
        'Specify camera angle or perspective'
      ];

      mockPromptManagementService.breakdownPrompt.mockResolvedValue(mockBreakdown);
      mockGoogleAIService.generatePromptSuggestions.mockResolvedValue(mockSuggestions);
      mockProjectService.getProjectById.mockResolvedValue(mockProject);

      // Test breakdown
      const breakdown = await assetGenerationService.breakdownPrompt(
        prompt,
        mockProject.id,
        'prompt',
        aiConfig
      );

      expect(breakdown).toEqual(mockBreakdown);
      expect(mockPromptManagementService.breakdownPrompt).toHaveBeenCalledWith(
        prompt,
        mockProject.id,
        'prompt',
        aiConfig
      );

      // Test suggestions
      const suggestions = await assetGenerationService.generatePromptSuggestions(
        prompt,
        mockProject.id,
        aiConfig,
        { assetType: 'prompt', count: 3 }
      );

      expect(suggestions).toEqual(mockSuggestions);
      expect(mockGoogleAIService.generatePromptSuggestions).toHaveBeenCalledWith(
        prompt,
        { apiKey: aiConfig.apiKey, model: aiConfig.model },
        {
          assetType: 'prompt',
          artStyle: mockProject.artStyle?.description,
          count: 3
        }
      );
    });
  });

  describe('metadata tracking', () => {
    it('should properly track Google AI metadata in assets', async () => {
      const generationRequest = {
        projectId: mockProject.id,
        type: 'prompt' as const,
        name: 'Metadata Test',
        generationPrompt: 'Test prompt for metadata',
        aiConfig: {
          provider: 'google',
          model: 'gemini-pro',
          apiKey: 'test-key'
        }
      };

      const mockEnhancedResponse = {
        text: 'Enhanced test prompt',
        finishReason: 'STOP',
        safetyRatings: [
          { category: 'HARM_CATEGORY_HARASSMENT', probability: 'NEGLIGIBLE' }
        ]
      };

      // Setup mocks
      mockProjectService.getProjectById.mockResolvedValue(mockProject);
      mockAssetService.createAsset.mockResolvedValue(mockAsset);
      mockGenerationJobService.createJob.mockResolvedValue(mockJob);
      mockGenerationJobService.getJobById.mockResolvedValue(mockJob);
      mockGenerationJobService.updateJob.mockResolvedValue(mockJob);
      mockGoogleAIService.generateText.mockResolvedValue(mockEnhancedResponse);
      mockFileManager.ensureDirectoryExists.mockResolvedValue();
      mockFileManager.writeFile.mockResolvedValue();
      mockAssetService.getAssetById.mockResolvedValue(mockAsset);
      mockAssetService.updateAsset.mockResolvedValue(mockAsset);
      mockPromptManagementService.savePromptHistory.mockResolvedValue({
        id: 'history-id',
        projectId: mockProject.id,
        originalPrompt: generationRequest.generationPrompt,
        enhancedPrompt: mockEnhancedResponse.text,
        version: 1,
        metadata: {},
        createdAt: new Date().toISOString()
      });

      // Execute
      await assetGenerationService.generateAsset(generationRequest);

      // Allow async processing to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify asset was updated with Google AI metadata
      expect(mockAssetService.updateAsset).toHaveBeenCalledWith(
        mockAsset.id,
        expect.objectContaining({
          metadata: expect.objectContaining({
            format: 'txt',
            fileSize: expect.any(Number),
            googleAI: {
              model: 'gemini-pro',
              finishReason: 'STOP',
              safetyRatings: mockEnhancedResponse.safetyRatings
            }
          })
        })
      );
    });
  });
});