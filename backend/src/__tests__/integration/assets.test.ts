import request from 'supertest';
import express from 'express';
import { apiRoutes } from '../../routes';
import { fileManager } from '../../services/FileManager';
import { errorHandler } from '../../middleware';
import path from 'path';
import fs from 'fs/promises';

// Create test app
const app = express();
app.use(express.json());
app.use('/api', apiRoutes);
app.use(errorHandler);

describe('Asset API Integration Tests', () => {
  let testProjectId: string;
  let testAssetId: string;

  beforeAll(async () => {
    // Initialize FileManager with test data directory
    const testDataDir = path.join(__dirname, '../../__test_data__');
    (fileManager as any).dataDir = testDataDir;
    await fileManager.initialize();
  });

  beforeEach(async () => {
    // Create a test project
    const projectData = {
      name: 'Test Project for Assets',
      description: 'Test project for asset API testing',
      context: 'Testing context',
      artStyle: {
        description: 'Test art style',
        referenceImages: [],
        styleKeywords: ['test', 'style']
      }
    };

    const projectResponse = await request(app)
      .post('/api/projects')
      .send(projectData)
      .expect(201);

    testProjectId = projectResponse.body.id;
  });

  afterEach(async () => {
    // Clean up test data
    try {
      const testDataDir = path.join(__dirname, '../../__test_data__');
      await fs.rm(testDataDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('POST /api/projects/:projectId/assets', () => {
    it('should create a new asset', async () => {
      const assetData = {
        type: 'image' as const,
        name: 'Test Image Asset',
        description: 'A test image asset',
        generationPrompt: 'A beautiful landscape',
        generationParameters: {
          width: 512,
          height: 512,
          steps: 20
        },
        status: 'pending' as const,
        metadata: {
          dimensions: {
            width: 512,
            height: 512
          }
        }
      };

      const response = await request(app)
        .post(`/api/projects/${testProjectId}/assets`)
        .send(assetData)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        projectId: testProjectId,
        type: 'image',
        name: 'Test Image Asset',
        description: 'A test image asset',
        generationPrompt: 'A beautiful landscape',
        status: 'pending',
        createdAt: expect.any(String)
      });

      testAssetId = response.body.id;
    });

    it('should return 400 for invalid asset data', async () => {
      const invalidAssetData = {
        type: 'invalid_type',
        name: '', // Empty name should fail validation
        generationPrompt: 'Test prompt'
      };

      const response = await request(app)
        .post(`/api/projects/${testProjectId}/assets`)
        .send(invalidAssetData)
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for missing project ID', async () => {
      const assetData = {
        type: 'image' as const,
        name: 'Test Asset',
        generationPrompt: 'Test prompt',
        generationParameters: {},
        status: 'pending' as const,
        metadata: {}
      };

      await request(app)
        .post('/api/projects//assets') // Empty project ID
        .send(assetData)
        .expect(404); // Express treats empty param as not found
    });
  });

  describe('GET /api/projects/:projectId/assets', () => {
    beforeEach(async () => {
      // Create a test asset
      const assetData = {
        type: 'image' as const,
        name: 'Test Asset for List',
        description: 'Test asset',
        generationPrompt: 'Test prompt',
        generationParameters: {},
        status: 'completed' as const,
        metadata: {}
      };

      const response = await request(app)
        .post(`/api/projects/${testProjectId}/assets`)
        .send(assetData)
        .expect(201);

      testAssetId = response.body.id;
    });

    it('should return all assets for a project', async () => {
      const response = await request(app)
        .get(`/api/projects/${testProjectId}/assets`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        id: testAssetId,
        projectId: testProjectId,
        name: 'Test Asset for List'
      });
    });

    it('should return empty array for project with no assets', async () => {
      // Create another project without assets
      const projectData = {
        name: 'Empty Project',
        description: 'Project with no assets',
        context: 'Testing',
        artStyle: {
          description: 'Test style',
          referenceImages: [],
          styleKeywords: []
        }
      };

      const projectResponse = await request(app)
        .post('/api/projects')
        .send(projectData)
        .expect(201);

      const emptyProjectId = projectResponse.body.id;

      const response = await request(app)
        .get(`/api/projects/${emptyProjectId}/assets`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });
  });

  describe('GET /api/assets/:id', () => {
    beforeEach(async () => {
      // Create a test asset
      const assetData = {
        type: 'video' as const,
        name: 'Test Video Asset',
        description: 'A test video asset',
        generationPrompt: 'A short video clip',
        generationParameters: {
          duration: 5,
          fps: 30
        },
        status: 'completed' as const,
        metadata: {
          duration: 5,
          format: 'mp4'
        }
      };

      const response = await request(app)
        .post(`/api/projects/${testProjectId}/assets`)
        .send(assetData)
        .expect(201);

      testAssetId = response.body.id;
    });

    it('should return asset by ID', async () => {
      const response = await request(app)
        .get(`/api/assets/${testAssetId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: testAssetId,
        projectId: testProjectId,
        type: 'video',
        name: 'Test Video Asset',
        description: 'A test video asset'
      });
    });

    it('should return 404 for non-existent asset', async () => {
      const fakeId = 'non-existent-id';
      const response = await request(app)
        .get(`/api/assets/${fakeId}`)
        .expect(404);

      expect(response.body.error.code).toBe('ASSET_NOT_FOUND');
    });
  });

  describe('PUT /api/assets/:id', () => {
    beforeEach(async () => {
      // Create a test asset
      const assetData = {
        type: 'prompt' as const,
        name: 'Original Name',
        description: 'Original description',
        generationPrompt: 'Original prompt',
        generationParameters: {},
        status: 'completed' as const,
        metadata: {}
      };

      const response = await request(app)
        .post(`/api/projects/${testProjectId}/assets`)
        .send(assetData)
        .expect(201);

      testAssetId = response.body.id;
    });

    it('should update asset name and description', async () => {
      const updateData = {
        name: 'Updated Name',
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/api/assets/${testAssetId}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        id: testAssetId,
        name: 'Updated Name',
        description: 'Updated description'
      });
    });

    it('should return 404 for non-existent asset', async () => {
      const updateData = {
        name: 'Updated Name'
      };

      const response = await request(app)
        .put('/api/assets/non-existent-id')
        .send(updateData)
        .expect(404);

      expect(response.body.error.code).toBe('ASSET_NOT_FOUND');
    });

    it('should return 400 for invalid update data', async () => {
      const invalidUpdateData = {
        name: '' // Empty name should fail validation
      };

      const response = await request(app)
        .put(`/api/assets/${testAssetId}`)
        .send(invalidUpdateData)
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('DELETE /api/assets/:id', () => {
    beforeEach(async () => {
      // Create a test asset
      const assetData = {
        type: 'image' as const,
        name: 'Asset to Delete',
        description: 'This asset will be deleted',
        generationPrompt: 'Delete me',
        generationParameters: {},
        status: 'completed' as const,
        metadata: {}
      };

      const response = await request(app)
        .post(`/api/projects/${testProjectId}/assets`)
        .send(assetData)
        .expect(201);

      testAssetId = response.body.id;
    });

    it('should delete asset', async () => {
      await request(app)
        .delete(`/api/assets/${testAssetId}`)
        .expect(204);

      // Verify asset is deleted
      await request(app)
        .get(`/api/assets/${testAssetId}`)
        .expect(404);
    });

    it('should return 404 for non-existent asset', async () => {
      const response = await request(app)
        .delete('/api/assets/non-existent-id')
        .expect(404);

      expect(response.body.error.code).toBe('ASSET_NOT_FOUND');
    });
  });

  describe('GET /api/assets/:id/download', () => {
    it('should return 404 for asset without file', async () => {
      // Create asset without file
      const assetData = {
        type: 'prompt' as const,
        name: 'Text Asset',
        description: 'No file attached',
        generationPrompt: 'Just text',
        generationParameters: {},
        status: 'completed' as const,
        metadata: {}
      };

      const response = await request(app)
        .post(`/api/projects/${testProjectId}/assets`)
        .send(assetData)
        .expect(201);

      testAssetId = response.body.id;

      const downloadResponse = await request(app)
        .get(`/api/assets/${testAssetId}/download`)
        .expect(404);

      expect(downloadResponse.body.error.code).toBe('FILE_NOT_FOUND');
    });

    it('should return 404 for non-existent asset', async () => {
      const response = await request(app)
        .get('/api/assets/non-existent-id/download')
        .expect(404);

      expect(response.body.error.code).toBe('ASSET_NOT_FOUND');
    });
  });
});