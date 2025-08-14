import { projectService, assetService, generationJobService, fileManager } from './models';
import { ProjectSchema, AssetSchema, GenerationJobSchema } from '@asset-tool/types';

async function testServices() {
  try {
    console.log('Testing service imports and validation...');
    
    // Initialize file manager
    await fileManager.initialize();
    console.log('✓ FileManager initialized successfully');
    
    // Test that we can import the services
    console.log('✓ Services imported successfully');
    
    // Test basic validation with Zod schemas
    const validProject = {
      name: 'Test Project',
      description: 'Test description',
      context: 'Test context',
      artStyle: {
        description: 'Test art style',
        referenceImages: [],
        styleKeywords: []
      }
    };
    
    // Test project creation
    const createdProject = await projectService.createProject(validProject);
    console.log('✓ Project creation works');
    
    const validAsset = {
      projectId: createdProject.id,
      type: 'image' as const,
      name: 'Test Asset',
      generationPrompt: 'Test prompt',
      generationParameters: {},
      status: 'pending' as const,
      metadata: {}
    };
    
    const createdAsset = await assetService.createAsset(validAsset);
    console.log('✓ Asset creation works');
    
    const validJob = {
      assetId: createdAsset.id,
      status: 'queued' as const,
      progress: 0
    };
    
    const createdJob = await generationJobService.createJob(validJob);
    console.log('✓ GenerationJob creation works');
    
    // Test retrieval
    const retrievedProject = await projectService.getProjectById(createdProject.id);
    const retrievedAsset = await assetService.getAssetById(createdAsset.id);
    const retrievedJob = await generationJobService.getJobById(createdJob.id);
    
    console.log('✓ Data retrieval works');
    
    // Test validation schemas directly
    ProjectSchema.parse(createdProject);
    AssetSchema.parse(createdAsset);
    GenerationJobSchema.parse(createdJob);
    console.log('✓ Zod schema validation works');
    
    console.log('All service tests passed!');
    
  } catch (error) {
    console.error('Service test failed:', error);
    process.exit(1);
  }
}

testServices();