import { PromptManagementService } from '../../services/PromptManagementService';
import { googleAIService } from '../../services/ai/GoogleAIService';
import { projectService } from '../../services/ProjectService';
import { fileManager } from '../../services/FileManager';
import { Project } from '@asset-tool/types';

// Mock the services
jest.mock('../../services/ai/GoogleAIService');
jest.mock('../../services/ProjectService');
jest.mock('../../services/FileManager');

const mockGoogleAIService = googleAIService as jest.Mocked<typeof googleAIService>;
const mockProjectService = projectService as jest.Mocked<typeof projectService>;
const mockFileManager = fileManager as jest.Mocked<typeof fileManager>;

describe('PromptManagementService', () => {
  let promptManagementService: PromptManagementService;
  let mockProject: Project;

  beforeEach(() => {
    promptManagementService = new PromptManagementService();
    
    mockProject = {
      id: 'test-project-id',
      name: 'Test Project',
      description: 'Test project for prompt management',
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
    
    // Setup default file manager mocks
    mockFileManager.ensureDirectoryExists.mockResolvedValue();
    mockFileManager.fileExists.mockResolvedValue(true);
    mockFileManager.readJSON.mockResolvedValue([]);
    mockFileManager.writeJSON.mockResolvedValue();
  });

  describe('breakdownPrompt', () => {
    it('should break down prompt using Google AI when configured', async () => {
      const prompt = 'A beautiful mountain landscape with golden hour lighting';
      const aiConfig = {
        provider: 'google',
        model: 'gemini-pro',
        apiKey: 'test-api-key'
      };

      const mockAIResponse = {
        text: JSON.stringify({
          components: [
            {
              type: 'subject',
              label: 'Main Subject',
              value: 'mountain landscape',
              description: 'The primary subject of the image',
              weight: 10
            },
            {
              type: 'lighting',
              label: 'Lighting',
              value: 'golden hour lighting',
              description: 'Warm, soft lighting during golden hour',
              weight: 8
            }
          ]
        })
      };

      mockGoogleAIService.generateText.mockResolvedValue(mockAIResponse);

      const result = await promptManagementService.breakdownPrompt(
        prompt,
        mockProject.id,
        'image',
        aiConfig
      );

      expect(result.originalPrompt).toBe(prompt);
      expect(result.components).toHaveLength(2);
      expect(result.components[0].type).toBe('subject');
      expect(result.components[0].value).toBe('mountain landscape');
      expect(result.components[1].type).toBe('lighting');
      expect(result.components[1].value).toBe('golden hour lighting');
      expect(result.reconstructedPrompt).toContain('mountain landscape');
      expect(result.reconstructedPrompt).toContain('golden hour lighting');
      
      expect(mockGoogleAIService.generateText).toHaveBeenCalledWith(
        expect.stringContaining(prompt),
        { apiKey: aiConfig.apiKey, model: aiConfig.model },
        { temperature: 0.3, maxOutputTokens: 1000 }
      );
    });

    it('should use rule-based breakdown when no AI config provided', async () => {
      const prompt = 'A photorealistic mountain landscape with dramatic lighting, 4k resolution';

      const result = await promptManagementService.breakdownPrompt(
        prompt,
        mockProject.id,
        'image'
      );

      expect(result.originalPrompt).toBe(prompt);
      expect(result.components.length).toBeGreaterThan(0);
      
      // Should extract style, lighting, and quality components
      const componentTypes = result.components.map(c => c.type);
      expect(componentTypes).toContain('subject');
      expect(componentTypes).toContain('style');
      expect(componentTypes).toContain('lighting');
      expect(componentTypes).toContain('quality');
    });

    it('should handle AI parsing errors gracefully', async () => {
      const prompt = 'A mountain landscape';
      const aiConfig = {
        provider: 'google',
        model: 'gemini-pro',
        apiKey: 'test-api-key'
      };

      // Mock invalid JSON response
      const mockAIResponse = {
        text: 'Invalid JSON response'
      };

      mockGoogleAIService.generateText.mockResolvedValue(mockAIResponse);

      const result = await promptManagementService.breakdownPrompt(
        prompt,
        mockProject.id,
        'image',
        aiConfig
      );

      expect(result.originalPrompt).toBe(prompt);
      expect(result.components).toHaveLength(0); // Should fall back to empty array
    });
  });

  describe('generatePromptSuggestions', () => {
    it('should generate suggestions using Google AI when configured', async () => {
      const prompt = 'A mountain landscape';
      const aiConfig = {
        provider: 'google',
        model: 'gemini-pro',
        apiKey: 'test-api-key'
      };

      const mockAIResponse = {
        text: JSON.stringify({
          suggestions: [
            {
              type: 'improvement',
              title: 'Add Lighting Details',
              description: 'Specify lighting conditions for better visual appeal',
              suggestedChange: 'Add "golden hour lighting" or "dramatic shadows"',
              confidence: 0.8,
              category: 'lighting',
              reasoning: 'Lighting specifications improve image quality'
            }
          ]
        })
      };

      mockProjectService.getProjectById.mockResolvedValue(mockProject);
      mockGoogleAIService.generateText.mockResolvedValue(mockAIResponse);

      const result = await promptManagementService.generatePromptSuggestions(
        prompt,
        mockProject.id,
        'image',
        aiConfig
      );

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('improvement');
      expect(result[0].title).toBe('Add Lighting Details');
      expect(result[0].confidence).toBe(0.8);
      
      expect(mockProjectService.getProjectById).toHaveBeenCalledWith(mockProject.id);
      expect(mockGoogleAIService.generateText).toHaveBeenCalled();
    });

    it('should use rule-based suggestions when no AI config provided', async () => {
      const prompt = 'A mountain landscape'; // Missing quality and lighting

      const result = await promptManagementService.generatePromptSuggestions(
        prompt,
        mockProject.id,
        'image'
      );

      expect(result.length).toBeGreaterThan(0);
      
      // Should suggest adding quality descriptors and lighting
      const suggestionTitles = result.map(s => s.title);
      expect(suggestionTitles).toContain('Add Quality Descriptors');
      expect(suggestionTitles).toContain('Specify Lighting');
    });
  });

  describe('getPromptTemplates', () => {
    it('should return filtered templates by asset type', async () => {
      const mockTemplates = [
        {
          id: '1',
          name: 'Landscape Template',
          assetType: 'image',
          category: 'landscape',
          tags: ['nature', 'outdoor']
        },
        {
          id: '2',
          name: 'Video Template',
          assetType: 'video',
          category: 'cinematic',
          tags: ['motion', 'cinematic']
        }
      ];

      mockFileManager.readJSON.mockResolvedValue(mockTemplates);

      const result = await promptManagementService.getPromptTemplates('image');

      expect(result).toHaveLength(1);
      expect(result[0].assetType).toBe('image');
      expect(result[0].name).toBe('Landscape Template');
    });

    it('should return filtered templates by category and tags', async () => {
      const mockTemplates = [
        {
          id: '1',
          name: 'Nature Landscape',
          assetType: 'image',
          category: 'landscape',
          tags: ['nature', 'outdoor']
        },
        {
          id: '2',
          name: 'Urban Landscape',
          assetType: 'image',
          category: 'landscape',
          tags: ['urban', 'city']
        }
      ];

      mockFileManager.readJSON.mockResolvedValue(mockTemplates);

      const result = await promptManagementService.getPromptTemplates(
        'image',
        'landscape',
        ['nature']
      );

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Nature Landscape');
    });
  });

  describe('createPromptTemplate', () => {
    it('should create a new template with generated ID and timestamps', async () => {
      const templateData = {
        name: 'Test Template',
        description: 'A test template',
        assetType: 'image' as const,
        category: 'test',
        components: [],
        examplePrompt: 'Test prompt',
        tags: ['test']
      };

      mockFileManager.readJSON.mockResolvedValue([]);

      const result = await promptManagementService.createPromptTemplate(templateData);

      expect(result.id).toBeDefined();
      expect(result.name).toBe(templateData.name);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      
      expect(mockFileManager.writeJSON).toHaveBeenCalledWith(
        expect.stringContaining('templates.json'),
        expect.arrayContaining([result])
      );
    });
  });

  describe('savePromptHistory', () => {
    it('should save prompt history with version tracking', async () => {
      const projectId = 'test-project';
      const originalPrompt = 'Original prompt';
      const enhancedPrompt = 'Enhanced prompt';

      mockFileManager.readJSON.mockResolvedValue([]);

      const result = await promptManagementService.savePromptHistory(
        projectId,
        originalPrompt,
        enhancedPrompt
      );

      expect(result.id).toBeDefined();
      expect(result.projectId).toBe(projectId);
      expect(result.originalPrompt).toBe(originalPrompt);
      expect(result.enhancedPrompt).toBe(enhancedPrompt);
      expect(result.version).toBe(1);
      expect(result.createdAt).toBeDefined();
      
      expect(mockFileManager.writeJSON).toHaveBeenCalledWith(
        expect.stringContaining('history.json'),
        expect.arrayContaining([result])
      );
    });

    it('should increment version for existing project history', async () => {
      const projectId = 'test-project';
      const existingHistory = [
        {
          id: 'existing-1',
          projectId,
          originalPrompt: 'First prompt',
          version: 1,
          metadata: {},
          createdAt: new Date().toISOString()
        },
        {
          id: 'existing-2',
          projectId,
          originalPrompt: 'Second prompt',
          version: 2,
          metadata: {},
          createdAt: new Date().toISOString()
        }
      ];

      mockFileManager.readJSON.mockResolvedValue(existingHistory);

      const result = await promptManagementService.savePromptHistory(
        projectId,
        'New prompt'
      );

      expect(result.version).toBe(3); // Should be next version
    });
  });

  describe('getPromptHistory', () => {
    it('should return history sorted by creation date', async () => {
      const projectId = 'test-project';
      const mockHistory = [
        {
          id: '1',
          projectId,
          originalPrompt: 'First',
          version: 1,
          metadata: {},
          createdAt: '2023-01-01T00:00:00.000Z'
        },
        {
          id: '2',
          projectId,
          originalPrompt: 'Second',
          version: 2,
          metadata: {},
          createdAt: '2023-01-02T00:00:00.000Z'
        }
      ];

      mockFileManager.readJSON.mockResolvedValue(mockHistory);

      const result = await promptManagementService.getPromptHistory(projectId);

      expect(result).toHaveLength(2);
      expect(result[0].createdAt).toBe('2023-01-02T00:00:00.000Z'); // Most recent first
      expect(result[1].createdAt).toBe('2023-01-01T00:00:00.000Z');
    });

    it('should filter by asset ID when provided', async () => {
      const projectId = 'test-project';
      const assetId = 'test-asset';
      const mockHistory = [
        {
          id: '1',
          projectId,
          assetId,
          originalPrompt: 'Asset prompt',
          version: 1,
          metadata: {},
          createdAt: '2023-01-01T00:00:00.000Z'
        },
        {
          id: '2',
          projectId,
          originalPrompt: 'Project prompt',
          version: 1,
          metadata: {},
          createdAt: '2023-01-02T00:00:00.000Z'
        }
      ];

      mockFileManager.readJSON.mockResolvedValue(mockHistory);

      const result = await promptManagementService.getPromptHistory(projectId, assetId);

      expect(result).toHaveLength(1);
      expect(result[0].assetId).toBe(assetId);
    });
  });
});