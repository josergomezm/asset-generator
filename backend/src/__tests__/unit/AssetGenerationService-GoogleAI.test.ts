import { AssetGenerationService } from '../../services/AssetGenerationService';
import { googleAIService } from '../../services/ai/GoogleAIService';
import { projectService } from '../../services/ProjectService';
import { Project } from '@asset-tool/types';

// Mock the services
jest.mock('../../services/ai/GoogleAIService');
jest.mock('../../services/ProjectService');

const mockGoogleAIService = googleAIService as jest.Mocked<typeof googleAIService>;
const mockProjectService = projectService as jest.Mocked<typeof projectService>;

describe('AssetGenerationService - Google AI Integration', () => {
  let assetGenerationService: AssetGenerationService;
  let mockProject: Project;

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

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('generatePromptSuggestions', () => {
    it('should generate prompt suggestions using Google AI', async () => {
      const basePrompt = 'A beautiful landscape';
      const aiConfig = {
        provider: 'google',
        model: 'gemini-pro',
        apiKey: 'test-api-key'
      };

      const mockSuggestions = [
        'A beautiful landscape with rolling hills and golden sunset',
        'A serene landscape featuring mountains and crystal clear lake',
        'A breathtaking landscape with wildflowers and dramatic sky'
      ];

      mockProjectService.getProjectById.mockResolvedValue(mockProject);
      mockGoogleAIService.generatePromptSuggestions.mockResolvedValue(mockSuggestions);

      const result = await assetGenerationService.generatePromptSuggestions(
        basePrompt,
        mockProject.id,
        aiConfig,
        { assetType: 'image', count: 3 }
      );

      expect(result).toEqual(mockSuggestions);
      expect(mockProjectService.getProjectById).toHaveBeenCalledWith(mockProject.id);
      expect(mockGoogleAIService.generatePromptSuggestions).toHaveBeenCalledWith(
        basePrompt,
        { apiKey: aiConfig.apiKey, model: aiConfig.model },
        {
          assetType: 'image',
          artStyle: mockProject.artStyle?.description,
          count: 3
        }
      );
    });

    it('should throw error for non-Google AI provider', async () => {
      const aiConfig = {
        provider: 'openai',
        model: 'gpt-4',
        apiKey: 'test-api-key'
      };

      mockProjectService.getProjectById.mockResolvedValue(mockProject);

      await expect(
        assetGenerationService.generatePromptSuggestions(
          'test prompt',
          mockProject.id,
          aiConfig
        )
      ).rejects.toThrow('Prompt suggestions currently only supported with Google AI');
    });

    it('should throw error if project not found', async () => {
      const aiConfig = {
        provider: 'google',
        model: 'gemini-pro',
        apiKey: 'test-api-key'
      };

      mockProjectService.getProjectById.mockResolvedValue(null);

      await expect(
        assetGenerationService.generatePromptSuggestions(
          'test prompt',
          'non-existent-project',
          aiConfig
        )
      ).rejects.toThrow('Project non-existent-project not found');
    });
  });

  describe('scorePrompt', () => {
    it('should score prompt quality using Google AI', async () => {
      const prompt = 'A detailed landscape with mountains and lake';
      const aiConfig = {
        provider: 'google',
        model: 'gemini-pro',
        apiKey: 'test-api-key'
      };

      const mockScoreResult = {
        score: 85,
        feedback: 'Good prompt with clear visual elements. Could benefit from more specific lighting details.',
        suggestions: [
          'Add specific lighting conditions (golden hour, dramatic shadows)',
          'Include more detailed composition elements',
          'Specify camera angle or perspective'
        ]
      };

      mockProjectService.getProjectById.mockResolvedValue(mockProject);
      mockGoogleAIService.scorePrompt.mockResolvedValue(mockScoreResult);

      const result = await assetGenerationService.scorePrompt(
        prompt,
        mockProject.id,
        aiConfig,
        'image'
      );

      expect(result).toEqual(mockScoreResult);
      expect(mockProjectService.getProjectById).toHaveBeenCalledWith(mockProject.id);
      expect(mockGoogleAIService.scorePrompt).toHaveBeenCalledWith(
        prompt,
        { apiKey: aiConfig.apiKey, model: aiConfig.model },
        {
          assetType: 'image',
          artStyle: mockProject.artStyle?.description
        }
      );
    });

    it('should throw error for non-Google AI provider', async () => {
      const aiConfig = {
        provider: 'openai',
        model: 'gpt-4',
        apiKey: 'test-api-key'
      };

      mockProjectService.getProjectById.mockResolvedValue(mockProject);

      await expect(
        assetGenerationService.scorePrompt(
          'test prompt',
          mockProject.id,
          aiConfig,
          'image'
        )
      ).rejects.toThrow('Prompt scoring currently only supported with Google AI');
    });
  });

  describe('buildEnhancedPromptWithAI', () => {
    it('should enhance prompt with Google AI when configured', async () => {
      const basePrompt = 'A mountain landscape';
      const aiConfig = {
        provider: 'google',
        model: 'gemini-pro',
        apiKey: 'test-api-key'
      };

      const mockEnhancedResponse = {
        text: 'A breathtaking mountain landscape with snow-capped peaks, dramatic lighting, and crystal clear alpine lake in the foreground, captured in modern minimalist style with clean composition',
        finishReason: 'STOP'
      };

      mockGoogleAIService.enhancePrompt.mockResolvedValue(mockEnhancedResponse);

      // Access private method for testing
      const service = assetGenerationService as any;
      const result = await service.buildEnhancedPromptWithAI(
        basePrompt,
        mockProject,
        undefined,
        aiConfig,
        'image'
      );

      expect(result).toBe(mockEnhancedResponse.text);
      expect(mockGoogleAIService.enhancePrompt).toHaveBeenCalledWith(
        expect.stringContaining(basePrompt),
        { apiKey: aiConfig.apiKey, model: aiConfig.model },
        {
          assetType: 'image',
          artStyle: mockProject.artStyle?.description,
          styleKeywords: mockProject.artStyle?.styleKeywords
        }
      );
    });

    it('should fall back to basic enhancement if Google AI fails', async () => {
      const basePrompt = 'A mountain landscape';
      const aiConfig = {
        provider: 'google',
        model: 'gemini-pro',
        apiKey: 'test-api-key'
      };

      mockGoogleAIService.enhancePrompt.mockRejectedValue(new Error('API Error'));

      // Access private method for testing
      const service = assetGenerationService as any;
      const result = await service.buildEnhancedPromptWithAI(
        basePrompt,
        mockProject,
        undefined,
        aiConfig,
        'image'
      );

      // Should return basic enhanced prompt (with style info)
      expect(result).toContain(basePrompt);
      expect(result).toContain('Modern minimalist style');
      expect(result).toContain('minimalist, clean, modern');
    });

    it('should use basic enhancement when no AI config provided', async () => {
      const basePrompt = 'A mountain landscape';

      // Access private method for testing
      const service = assetGenerationService as any;
      const result = await service.buildEnhancedPromptWithAI(
        basePrompt,
        mockProject,
        undefined,
        undefined,
        'image'
      );

      // Should return basic enhanced prompt
      expect(result).toContain(basePrompt);
      expect(result).toContain('Modern minimalist style');
      expect(result).toContain('minimalist, clean, modern');
      expect(mockGoogleAIService.enhancePrompt).not.toHaveBeenCalled();
    });

    it('should use style override when provided', async () => {
      const basePrompt = 'A mountain landscape';
      const styleOverride = {
        description: 'Dramatic cinematic style',
        keywords: ['dramatic', 'cinematic', 'moody']
      };

      // Access private method for testing
      const service = assetGenerationService as any;
      const result = await service.buildEnhancedPromptWithAI(
        basePrompt,
        mockProject,
        styleOverride,
        undefined,
        'image'
      );

      expect(result).toContain(basePrompt);
      expect(result).toContain('Dramatic cinematic style');
      expect(result).toContain('dramatic, cinematic, moody');
    });
  });
});