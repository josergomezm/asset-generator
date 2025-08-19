import request from 'supertest';
import { app } from '../../index';
import { fileManager } from '../../services/FileManager';
import { projectService } from '../../services/ProjectService';
import { v4 as uuidv4 } from 'uuid';

describe('Video Generation API', () => {
  let testProjectId: string;

  beforeAll(async () => {
    await fileManager.initialize();
  });

  beforeEach(async () => {
    // Create a test project
    const testProject = await projectService.createProject({
      name: 'Test Video Project',
      description: 'A test project for video generation',
      context: 'Testing video generation functionality',
      artStyle: {
        description: 'Cinematic style with dramatic lighting',
        referenceImages: [],
        styleKeywords: ['cinematic', 'dramatic', 'moody']
      }
    });
    testProjectId = testProject.id;
  });

  describe('POST /api/generate/video', () => {
    it('should start video generation successfully', async () => {
      const videoData = {
        projectId: testProjectId,
        name: 'Test Video Asset',
        description: 'A test video asset',
        generationPrompt: 'A beautiful sunset over the ocean',
        generationParameters: {
          duration: 5,
          fps: 30,
          resolution: '1080p',
          motion_intensity: 'medium'
        }
      };

      const response = await request(app)
        .post('/api/generate/video')
        .send(videoData)
        .expect(201);

      expect(response.body.asset).toBeDefined();
      expect(response.body.job).toBeDefined();
      expect(response.body.message).toBe('Video generation started successfully');
      expect(response.body.asset.type).toBe('video');
      expect(response.body.asset.name).toBe(videoData.name);
      expect(response.body.asset.generationPrompt).toBe(videoData.generationPrompt);
      expect(response.body.job.status).toBe('queued');
    });

    it('should return 404 for non-existent project', async () => {
      const videoData = {
        projectId: '00000000-0000-0000-0000-000000000000',
        name: 'Test Video Asset',
        generationPrompt: 'A beautiful sunset over the ocean'
      };

      const response = await request(app)
        .post('/api/generate/video')
        .send(videoData)
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
        .post('/api/generate/video')
        .send(invalidData)
        .expect(400);
    });

    it('should handle style override for video generation', async () => {
      const videoData = {
        projectId: testProjectId,
        name: 'Test Video with Style Override',
        generationPrompt: 'A futuristic cityscape',
        styleOverride: {
          description: 'Cyberpunk aesthetic with neon lights',
          keywords: ['cyberpunk', 'neon', 'futuristic']
        }
      };

      const response = await request(app)
        .post('/api/generate/video')
        .send(videoData)
        .expect(201);

      expect(response.body.asset.type).toBe('video');
      expect(response.body.job.status).toBe('queued');
    });
  });
});