import request from 'supertest';
import express from 'express';
import { apiRoutes } from '../../routes';
import { errorHandler } from '../../middleware';
import { fileManager } from '../../services/FileManager';
import { CreateProjectRequest } from '@asset-tool/types';

// Create test app
const app = express();
app.use(express.json());
app.use('/api', apiRoutes);
app.use(errorHandler);

describe('Project API Endpoints', () => {
  beforeAll(async () => {
    // Initialize FileManager for tests
    await fileManager.initialize();
  });

  describe('POST /api/projects', () => {
    it('should create a new project with valid data', async () => {
      const projectData: CreateProjectRequest = {
        name: 'Test Project',
        description: 'A test project for API testing',
        context: 'Testing context for the project',
        artStyle: {
          description: 'Modern minimalist style with clean lines',
          referenceImages: [],
          styleKeywords: ['modern', 'minimalist', 'clean']
        }
      };

      const response = await request(app)
        .post('/api/projects')
        .send(projectData)
        .expect(201);

      expect(response.body).toMatchObject({
        name: projectData.name,
        description: projectData.description,
        context: projectData.context,
        artStyle: projectData.artStyle
      });
      expect(response.body.id).toBeDefined();
      expect(response.body.createdAt).toBeDefined();
      expect(response.body.updatedAt).toBeDefined();
    });

    it('should return 400 for invalid project data', async () => {
      const invalidData = {
        name: '', // Invalid: empty name
        description: 'A'.repeat(501), // Invalid: too long
        context: 'Test context'
      };

      await request(app)
        .post('/api/projects')
        .send(invalidData)
        .expect(400);
    });
  });

  describe('GET /api/projects', () => {
    it('should return all projects', async () => {
      const response = await request(app)
        .get('/api/projects')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/projects/:id', () => {
    let projectId: string;

    beforeAll(async () => {
      // Create a test project
      const projectData: CreateProjectRequest = {
        name: 'Test Project for GET',
        description: 'A test project for GET endpoint testing',
        context: 'Testing context',
        artStyle: {
          description: 'Test style',
          referenceImages: [],
          styleKeywords: ['test']
        }
      };

      const createResponse = await request(app)
        .post('/api/projects')
        .send(projectData);
      
      projectId = createResponse.body.id;
    });

    it('should return project by ID', async () => {
      const response = await request(app)
        .get(`/api/projects/${projectId}`)
        .expect(200);

      expect(response.body.id).toBe(projectId);
      expect(response.body.name).toBe('Test Project for GET');
    });

    it('should return 404 for non-existent project', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      await request(app)
        .get(`/api/projects/${fakeId}`)
        .expect(404);
    });

    it('should return 400 for invalid ID format', async () => {
      await request(app)
        .get('/api/projects/invalid-id')
        .expect(400);
    });
  });

  describe('PUT /api/projects/:id', () => {
    let projectId: string;

    beforeAll(async () => {
      // Create a test project
      const projectData: CreateProjectRequest = {
        name: 'Test Project for PUT',
        description: 'A test project for PUT endpoint testing',
        context: 'Testing context',
        artStyle: {
          description: 'Test style',
          referenceImages: [],
          styleKeywords: ['test']
        }
      };

      const createResponse = await request(app)
        .post('/api/projects')
        .send(projectData);
      
      projectId = createResponse.body.id;
    });

    it('should update project with valid data', async () => {
      const updateData = {
        name: 'Updated Test Project',
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/api/projects/${projectId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe(updateData.name);
      expect(response.body.description).toBe(updateData.description);
      expect(response.body.updatedAt).not.toBe(response.body.createdAt);
    });

    it('should return 404 for non-existent project', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      const updateData = { name: 'Updated Name' };
      
      await request(app)
        .put(`/api/projects/${fakeId}`)
        .send(updateData)
        .expect(404);
    });
  });

  describe('DELETE /api/projects/:id', () => {
    let projectId: string;

    beforeEach(async () => {
      // Create a test project for each delete test
      const projectData: CreateProjectRequest = {
        name: 'Test Project for DELETE',
        description: 'A test project for DELETE endpoint testing',
        context: 'Testing context',
        artStyle: {
          description: 'Test style',
          referenceImages: [],
          styleKeywords: ['test']
        }
      };

      const createResponse = await request(app)
        .post('/api/projects')
        .send(projectData);
      
      projectId = createResponse.body.id;
    });

    it('should delete project successfully', async () => {
      await request(app)
        .delete(`/api/projects/${projectId}`)
        .expect(204);

      // Verify project is deleted
      await request(app)
        .get(`/api/projects/${projectId}`)
        .expect(404);
    });

    it('should return 404 for non-existent project', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      
      await request(app)
        .delete(`/api/projects/${fakeId}`)
        .expect(404);
    });
  });
});