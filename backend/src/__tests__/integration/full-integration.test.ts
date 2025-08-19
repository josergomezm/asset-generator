import request from 'supertest';
import { app } from '../../index';
import { testFileManager } from '../setup';
import type { Project, Asset } from '@asset-tool/types';

describe('Full Integration Tests', () => {
  let testProject: Project;
  let testAsset: Asset;

  beforeEach(async () => {
    // Clean slate for each test
    await testFileManager.initialize();
  });

  describe('Complete Workflow', () => {
    it('should handle complete project and asset lifecycle', async () => {
      // 1. Create a project
      const projectData = {
        name: 'Integration Test Project',
        description: 'A project for testing full integration',
        context: 'Testing context',
        artStyle: {
          description: 'Modern minimalist style',
          referenceImages: [],
          styleKeywords: ['modern', 'minimalist', 'clean']
        }
      };

      const createProjectResponse = await request(app)
        .post('/api/projects')
        .send(projectData)
        .expect(201);

      testProject = createProjectResponse.body;
      expect(testProject.id).toBeDefined();
      expect(testProject.name).toBe(projectData.name);

      // 2. Update the project
      const updateData = {
        description: 'Updated description for integration test'
      };

      const updateProjectResponse = await request(app)
        .put(`/api/projects/${testProject.id}`)
        .send(updateData)
        .expect(200);

      expect(updateProjectResponse.body.description).toBe(updateData.description);

      // 3. Get the project
      const getProjectResponse = await request(app)
        .get(`/api/projects/${testProject.id}`)
        .expect(200);

      expect(getProjectResponse.body.id).toBe(testProject.id);
      expect(getProjectResponse.body.description).toBe(updateData.description);

      // 4. Create an asset
      const assetData = {
        type: 'image',
        name: 'Test Image Asset',
        description: 'An image asset for testing',
        generationPrompt: 'A beautiful landscape',
        generationParameters: {
          width: 1024,
          height: 768,
          style: 'photorealistic'
        }
      };

      const createAssetResponse = await request(app)
        .post(`/api/projects/${testProject.id}/assets`)
        .send(assetData)
        .expect(201);

      testAsset = createAssetResponse.body;
      expect(testAsset.id).toBeDefined();
      expect(testAsset.projectId).toBe(testProject.id);
      expect(testAsset.name).toBe(assetData.name);

      // 5. Get project assets
      const getAssetsResponse = await request(app)
        .get(`/api/projects/${testProject.id}/assets`)
        .expect(200);

      expect(Array.isArray(getAssetsResponse.body)).toBe(true);
      expect(getAssetsResponse.body).toHaveLength(1);
      expect(getAssetsResponse.body[0].id).toBe(testAsset.id);

      // 6. Get specific asset
      const getAssetResponse = await request(app)
        .get(`/api/assets/${testAsset.id}`)
        .expect(200);

      expect(getAssetResponse.body.id).toBe(testAsset.id);

      // 7. Generate an image (mock generation)
      const generateData = {
        projectId: testProject.id,
        name: 'Generated Test Image',
        description: 'A generated image for testing',
        generationPrompt: 'A stunning sunset over mountains',
        generationParameters: {
          width: 1024,
          height: 768
        }
      };

      const generateResponse = await request(app)
        .post('/api/generate/image')
        .send(generateData)
        .expect(201);

      expect(generateResponse.body.asset).toBeDefined();
      expect(generateResponse.body.job).toBeDefined();
      expect(generateResponse.body.asset.projectId).toBe(testProject.id);

      const generatedAsset = generateResponse.body.asset;
      const generationJob = generateResponse.body.job;

      // 8. Check generation status
      const statusResponse = await request(app)
        .get(`/api/generate/status/${generationJob.id}`)
        .expect(200);

      expect(statusResponse.body.job).toBeDefined();
      expect(statusResponse.body.job.id).toBe(generationJob.id);

      // 9. Delete the generated asset
      await request(app)
        .delete(`/api/assets/${generatedAsset.id}`)
        .expect(204);

      // 10. Verify asset is deleted
      await request(app)
        .get(`/api/assets/${generatedAsset.id}`)
        .expect(404);

      // 11. Delete the original asset
      await request(app)
        .delete(`/api/assets/${testAsset.id}`)
        .expect(204);

      // 12. Verify project assets list is empty
      const emptyAssetsResponse = await request(app)
        .get(`/api/projects/${testProject.id}/assets`)
        .expect(200);

      expect(emptyAssetsResponse.body).toHaveLength(0);

      // 13. Delete the project
      await request(app)
        .delete(`/api/projects/${testProject.id}`)
        .expect(204);

      // 14. Verify project is deleted
      await request(app)
        .get(`/api/projects/${testProject.id}`)
        .expect(404);

      // 15. Verify projects list doesn't include deleted project
      const projectsResponse = await request(app)
        .get('/api/projects')
        .expect(200);

      const projectExists = projectsResponse.body.some((p: Project) => p.id === testProject.id);
      expect(projectExists).toBe(false);
    });

    it('should handle concurrent operations gracefully', async () => {
      // Create multiple projects concurrently
      const projectPromises = Array.from({ length: 5 }, (_, i) => 
        request(app)
          .post('/api/projects')
          .send({
            name: `Concurrent Project ${i + 1}`,
            description: `Project ${i + 1} for concurrent testing`,
            context: 'Concurrent testing context',
            artStyle: {
              description: 'Test style',
              referenceImages: [],
              styleKeywords: ['test']
            }
          })
      );

      const projectResponses = await Promise.all(projectPromises);
      
      // Verify all projects were created successfully
      projectResponses.forEach((response, i) => {
        expect(response.status).toBe(201);
        expect(response.body.name).toBe(`Concurrent Project ${i + 1}`);
      });

      const createdProjects = projectResponses.map(r => r.body);

      // Create assets for each project concurrently
      const assetPromises = createdProjects.map((project, i) =>
        request(app)
          .post(`/api/projects/${project.id}/assets`)
          .send({
            type: 'image',
            name: `Concurrent Asset ${i + 1}`,
            description: `Asset ${i + 1} for concurrent testing`,
            generationPrompt: `Test prompt ${i + 1}`,
            generationParameters: {}
          })
      );

      const assetResponses = await Promise.all(assetPromises);
      
      // Verify all assets were created successfully
      assetResponses.forEach((response, i) => {
        expect(response.status).toBe(201);
        expect(response.body.name).toBe(`Concurrent Asset ${i + 1}`);
      });

      // Clean up - delete all projects (which should cascade delete assets)
      const deletePromises = createdProjects.map(project =>
        request(app).delete(`/api/projects/${project.id}`)
      );

      const deleteResponses = await Promise.all(deletePromises);
      
      // Verify all deletions were successful
      deleteResponses.forEach(response => {
        expect(response.status).toBe(204);
      });
    });

    it('should handle error scenarios gracefully', async () => {
      // Test 404 errors
      await request(app)
        .get('/api/projects/00000000-0000-0000-0000-000000000000')
        .expect(404);

      await request(app)
        .get('/api/assets/00000000-0000-0000-0000-000000000000')
        .expect(404);

      // Test validation errors
      await request(app)
        .post('/api/projects')
        .send({
          // Missing required fields
          description: 'Invalid project'
        })
        .expect(400);

      // Create a valid project for further testing
      const projectResponse = await request(app)
        .post('/api/projects')
        .send({
          name: 'Error Test Project',
          description: 'Project for error testing',
          context: 'Error testing context',
          artStyle: {
            description: 'Test style',
            referenceImages: [],
            styleKeywords: ['test']
          }
        })
        .expect(201);

      const project = projectResponse.body;

      // Test invalid asset creation
      await request(app)
        .post(`/api/projects/${project.id}/assets`)
        .send({
          // Missing required fields
          description: 'Invalid asset'
        })
        .expect(400);

      // Test operations on non-existent resources
      await request(app)
        .put('/api/projects/00000000-0000-0000-0000-000000000000')
        .send({ name: 'Updated name' })
        .expect(404);

      await request(app)
        .delete('/api/assets/00000000-0000-0000-0000-000000000000')
        .expect(404);

      // Clean up
      await request(app)
        .delete(`/api/projects/${project.id}`)
        .expect(204);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large numbers of projects efficiently', async () => {
      const startTime = Date.now();
      
      // Create 20 projects
      const projectPromises = Array.from({ length: 20 }, (_, i) => 
        request(app)
          .post('/api/projects')
          .send({
            name: `Performance Project ${i + 1}`,
            description: `Project ${i + 1} for performance testing`,
            context: 'Performance testing context',
            artStyle: {
              description: 'Performance test style',
              referenceImages: [],
              styleKeywords: ['performance', 'test']
            }
          })
      );

      const projectResponses = await Promise.all(projectPromises);
      const creationTime = Date.now() - startTime;

      // Verify all projects were created
      expect(projectResponses).toHaveLength(20);
      projectResponses.forEach(response => {
        expect(response.status).toBe(201);
      });

      // Performance assertion - should complete within reasonable time
      expect(creationTime).toBeLessThan(10000); // 10 seconds

      // Test fetching all projects
      const fetchStartTime = Date.now();
      const allProjectsResponse = await request(app)
        .get('/api/projects')
        .expect(200);
      const fetchTime = Date.now() - fetchStartTime;

      expect(allProjectsResponse.body).toHaveLength(20);
      expect(fetchTime).toBeLessThan(2000); // 2 seconds

      // Clean up
      const createdProjects = projectResponses.map(r => r.body);
      const deletePromises = createdProjects.map(project =>
        request(app).delete(`/api/projects/${project.id}`)
      );

      await Promise.all(deletePromises);
    });
  });
});