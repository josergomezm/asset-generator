import request from 'supertest';
import { app } from '../../index';
import { fileManager } from '../../services/FileManager';
import { projectService } from '../../services/ProjectService';
import { v4 as uuidv4 } from 'uuid';

describe('Prompt Generation API', () => {
  let testProjectId: string;

  beforeAll(async () => {
    await fileManager.initialize();
  });

  beforeEach(async () => {
    // Create a test project
    const testProject = await projectService.createProject({
      name: 'Test Prompt Project',
      description: 'A test project for prompt generation',
      context: 'Testing prompt generation functionality',
      artStyle: {
        description: 'Creative and detailed style with rich descriptions',
        referenceImages: [],
        styleKeywords: ['detailed', 'creative', 'vivid']
      }
    });
    testProjectId = testProject.id;
  });

  describe('POST /api/generate/prompt', () => {
    it('should start prompt generation successfully', async () => {
      const promptData = {
        projectId: testProjectId,
        name: 'Test Prompt Asset',
        description: 'A test prompt asset',
        generationPrompt: 'A magical forest with glowing trees',
        generationParameters: {
          creativity: 'balanced',
          length: 'medium',
          focus: 'visual',
          variations: 1
        }
      };

      const response = await request(app)
        .post('/api/generate/prompt')
        .send(promptData)
        .expect(201);

      expect(response.body.asset).toBeDefined();
      expect(response.body.job).toBeDefined();
      expect(response.body.message).toBe('Prompt generation started successfully');
      expect(response.body.asset.type).toBe('prompt');
      expect(response.body.asset.name).toBe(promptData.name);
      expect(response.body.asset.generationPrompt).toBe(promptData.generationPrompt);
      expect(response.body.job.status).toBe('queued');
    });

    it('should return 404 for non-existent project', async () => {
      const promptData = {
        projectId: '00000000-0000-0000-0000-000000000000',
        name: 'Test Prompt Asset',
        generationPrompt: 'A magical forest with glowing trees'
      };

      const response = await request(app)
        .post('/api/generate/prompt')
        .send(promptData)
        .expect(404);

      expect(response.body.error.code).toBe('PROJECT_NOT_FOUND');
    });

    it('should return 400 for invalid request data', async () => {
      const invalidData = {
        projectId: 'invalid-uuid',
        name: '',
        generationPrompt: ''
      };

      await request(app)
        .post('/api/generate/prompt')
        .send(invalidData)
        .expect(400);
    });

    it('should handle style override for prompt generation', async () => {
      const promptData = {
        projectId: testProjectId,
        name: 'Test Prompt with Style Override',
        generationPrompt: 'A cyberpunk cityscape',
        generationParameters: {
          creativity: 'creative',
          length: 'long',
          focus: 'mood',
          variations: 3
        },
        styleOverride: {
          description: 'Dark and gritty cyberpunk aesthetic',
          keywords: ['cyberpunk', 'neon', 'dark', 'gritty']
        }
      };

      const response = await request(app)
        .post('/api/generate/prompt')
        .send(promptData)
        .expect(201);

      expect(response.body.asset.type).toBe('prompt');
      expect(response.body.job.status).toBe('queued');
    });

    it('should handle different creativity levels', async () => {
      const creativityLevels = ['conservative', 'balanced', 'creative', 'experimental'];
      
      for (const creativity of creativityLevels) {
        const promptData = {
          projectId: testProjectId,
          name: `Test ${creativity} Prompt`,
          generationPrompt: 'A serene landscape',
          generationParameters: {
            creativity,
            length: 'short',
            focus: 'visual',
            variations: 1
          }
        };

        const response = await request(app)
          .post('/api/generate/prompt')
          .send(promptData)
          .expect(201);

        expect(response.body.asset.type).toBe('prompt');
        expect(response.body.job.status).toBe('queued');
      }
    });
  });
});