import request from 'supertest';
import express from 'express';
import { apiRoutes } from '../routes';
import { fileManager } from '../services/FileManager';
import { errorHandler } from '../middleware';
import path from 'path';
import fs from 'fs/promises';

// Create test app
const app = express();
app.use(express.json());
app.use('/api', apiRoutes);
app.use(errorHandler);

describe('Debug Asset Creation', () => {
  let testProjectId: string;

  beforeAll(async () => {
    // Initialize FileManager with test data directory
    const testDataDir = path.join(__dirname, '../__debug_test_data__');
    (fileManager as any).dataDir = testDataDir;
    await fileManager.initialize();
  });

  afterAll(async () => {
    // Clean up test data
    try {
      const testDataDir = path.join(__dirname, '../__debug_test_data__');
      await fs.rm(testDataDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  it('should debug asset creation', async () => {
    // First create a project
    const projectData = {
      name: 'Debug Project',
      description: 'Debug project for asset testing',
      context: 'Debug context',
      artStyle: {
        description: 'Debug art style',
        referenceImages: [],
        styleKeywords: ['debug']
      }
    };

    const projectResponse = await request(app)
      .post('/api/projects')
      .send(projectData);

    console.log('Project creation response:', projectResponse.status, projectResponse.body);
    
    if (projectResponse.status !== 201) {
      return; // Skip asset creation if project creation failed
    }

    testProjectId = projectResponse.body.id;

    // Now try to create an asset
    const assetData = {
      type: 'image' as const,
      name: 'Debug Asset',
      description: 'Debug asset',
      generationPrompt: 'Debug prompt',
      generationParameters: {},
      metadata: {}
    };

    const assetResponse = await request(app)
      .post(`/api/projects/${testProjectId}/assets`)
      .send(assetData);

    console.log('Asset creation response:', assetResponse.status, assetResponse.body);
    if (assetResponse.body.error && assetResponse.body.error.details) {
      console.log('Validation errors:', JSON.stringify(assetResponse.body.error.details, null, 2));
    }
    
    // This test is just for debugging, so we don't assert anything
  });
});