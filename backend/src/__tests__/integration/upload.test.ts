import request from 'supertest';
import express from 'express';
import cors from 'cors';
import { apiRoutes } from '../../routes';
import { errorHandler } from '../../middleware';
import { fileManager } from '../../services/FileManager';
import path from 'path';
import fs from 'fs/promises';

describe('Upload Integration Tests', () => {
  let app: express.Application;
  let testProjectId: string;

  beforeAll(async () => {
    // Initialize FileManager for tests
    await fileManager.initialize();

    // Create Express app for testing
    app = express();
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use('/api', apiRoutes);
    app.use(errorHandler);
  });

  beforeEach(async () => {
    // Create a test project first
    const projectData = {
      name: 'Test Project',
      description: 'Test project for upload testing',
      context: 'Testing context',
      artStyle: {
        description: 'Test art style',
        referenceImages: [],
        styleKeywords: ['test', 'style']
      }
    };

    const response = await request(app)
      .post('/api/projects')
      .send(projectData)
      .expect(201);

    testProjectId = response.body.id;
  });

  afterEach(async () => {
    // Clean up test project
    if (testProjectId) {
      try {
        const projectDir = path.join(process.cwd(), 'data', 'projects', testProjectId);
        await fs.rm(projectDir, { recursive: true, force: true });
        
        // Also clean up from projects index
        const projectsIndexPath = path.join(process.cwd(), 'data', 'projects', 'projects.json');
        try {
          const projects = JSON.parse(await fs.readFile(projectsIndexPath, 'utf-8'));
          const filteredProjects = projects.filter((p: any) => p.id !== testProjectId);
          await fs.writeFile(projectsIndexPath, JSON.stringify(filteredProjects, null, 2));
        } catch (error) {
          // Ignore if projects.json doesn't exist
        }
      } catch (error) {
        console.warn('Failed to clean up test project:', error);
      }
    }
  });

  describe('POST /api/projects/:id/style', () => {
    it('should upload style reference images', async () => {
      // Create a simple test image buffer (1x1 pixel PNG)
      const testImageBuffer = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
        0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
        0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
      ]);

      const response = await request(app)
        .post(`/api/projects/${testProjectId}/style`)
        .attach('images', testImageBuffer, 'test-image.png')
        .expect(200);

      // Verify response structure
      expect(response.body).toHaveProperty('id', testProjectId);
      expect(response.body).toHaveProperty('artStyle');
      expect(response.body.artStyle).toHaveProperty('referenceImages');
      expect(response.body.artStyle.referenceImages).toHaveLength(1);
      expect(response.body.artStyle.referenceImages[0]).toMatch(/^style\/.*\.jpg$/);

      // Verify file was actually created
      const imagePath = response.body.artStyle.referenceImages[0];
      const fullPath = path.join(process.cwd(), 'data', 'projects', testProjectId, imagePath);
      const fileExists = await fs.access(fullPath).then(() => true).catch(() => false);
      expect(fileExists).toBe(true);
    });

    it('should upload multiple style reference images', async () => {
      const testImageBuffer = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
        0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
        0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
      ]);

      const response = await request(app)
        .post(`/api/projects/${testProjectId}/style`)
        .attach('images', testImageBuffer, 'test-image-1.png')
        .attach('images', testImageBuffer, 'test-image-2.png')
        .expect(200);

      // Verify response structure
      expect(response.body.artStyle.referenceImages).toHaveLength(2);
      expect(response.body.artStyle.referenceImages[0]).toMatch(/^style\/.*\.jpg$/);
      expect(response.body.artStyle.referenceImages[1]).toMatch(/^style\/.*\.jpg$/);
      expect(response.body.artStyle.referenceImages[0]).not.toBe(response.body.artStyle.referenceImages[1]);
    });

    it('should return 404 for non-existent project', async () => {
      const testImageBuffer = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
        0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
        0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
      ]);

      // Use a valid UUID format that doesn't exist
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';
      
      await request(app)
        .post(`/api/projects/${nonExistentId}/style`)
        .attach('images', testImageBuffer, 'test-image.png')
        .expect(404);
    });

    it('should return 400 when no files are uploaded', async () => {
      await request(app)
        .post(`/api/projects/${testProjectId}/style`)
        .expect(400);
    });

    it('should reject non-image files', async () => {
      const textBuffer = Buffer.from('This is not an image');

      await request(app)
        .post(`/api/projects/${testProjectId}/style`)
        .attach('images', textBuffer, 'test.txt')
        .expect(400);
    });
  });
});