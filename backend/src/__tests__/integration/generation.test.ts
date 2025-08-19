import request from 'supertest';
import { app } from '../../index';
import { fileManager } from '../../services/FileManager';

describe('Generation API Integration Tests', () => {
  beforeAll(async () => {
    await fileManager.initialize();
  });

  describe('POST /api/generate/image', () => {
    it('should return 404 for non-existent project', async () => {
      const generationData = {
        projectId: '00000000-0000-0000-0000-000000000000',
        name: 'Test Image',
        generationPrompt: 'A beautiful landscape'
      };

      const response = await request(app)
        .post('/api/generate/image')
        .send(generationData)
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
        .post('/api/generate/image')
        .send(invalidData)
        .expect(400);
    });
  });

  describe('GET /api/generate/status/:jobId', () => {
    it('should return 404 for non-existent job', async () => {
      const fakeJobId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app)
        .get(`/api/generate/status/${fakeJobId}`)
        .expect(404);

      expect(response.body.error.code).toBe('JOB_NOT_FOUND');
    });

    it('should return 400 for invalid job ID format', async () => {
      await request(app)
        .get('/api/generate/status/invalid-uuid')
        .expect(400);
    });
  });

  describe('DELETE /api/generate/cancel/:jobId', () => {
    it('should return 404 for non-existent job', async () => {
      const fakeJobId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app)
        .delete(`/api/generate/cancel/${fakeJobId}`)
        .expect(404);

      expect(response.body.error.code).toBe('JOB_NOT_FOUND_OR_NOT_CANCELLABLE');
    });

    it('should return 400 for invalid job ID format', async () => {
      await request(app)
        .delete('/api/generate/cancel/invalid-uuid')
        .expect(400);
    });
  });
});