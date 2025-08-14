import { ProjectService } from '../../services/ProjectService';
import { FileManager } from '../../services/FileManager';
import path from 'path';
import fs from 'fs/promises';

describe('Project Service', () => {
  let projectService: ProjectService;
  let fileManager: FileManager;
  let testDataDir: string;

  beforeAll(async () => {
    testDataDir = path.join(process.cwd(), 'test-data-projects');
    fileManager = new FileManager({ 
      dataDir: testDataDir,
      enableBackups: false 
    });
    await fileManager.initialize();
    projectService = new ProjectService();
  });

  afterAll(async () => {
    try {
      await fs.rm(testDataDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('Failed to clean up test data directory:', error);
    }
  });

  afterEach(async () => {
    try {
      await fs.rm(testDataDir, { recursive: true, force: true });
      await fileManager.initialize();
    } catch (error) {
      console.warn('Failed to clean up test data:', error);
    }
  });

  const validProjectData = {
    name: 'Test Project',
    description: 'A test project for validation',
    context: 'This is a test project context',
    artStyle: {
      description: 'Modern minimalist style',
      referenceImages: ['image1.jpg', 'image2.jpg'],
      styleKeywords: ['modern', 'minimalist', 'clean']
    }
  };

  describe('Valid Project Creation', () => {
    it('should create a project with valid data', async () => {
      const savedProject = await projectService.createProject(validProjectData);

      expect(savedProject.id).toBeDefined();
      expect(savedProject.name).toBe(validProjectData.name);
      expect(savedProject.description).toBe(validProjectData.description);
      expect(savedProject.context).toBe(validProjectData.context);
      expect(savedProject.artStyle.description).toBe(validProjectData.artStyle.description);
      expect(savedProject.artStyle.referenceImages).toEqual(validProjectData.artStyle.referenceImages);
      expect(savedProject.artStyle.styleKeywords).toEqual(validProjectData.artStyle.styleKeywords);
      expect(savedProject.createdAt).toBeDefined();
      expect(savedProject.updatedAt).toBeDefined();
    });

    it('should create a project with minimal required data', async () => {
      const minimalData = {
        name: 'Minimal Project',
        description: 'Minimal description',
        context: 'Minimal context',
        artStyle: {
          description: 'Minimal art style',
          referenceImages: [],
          styleKeywords: []
        }
      };

      const savedProject = await projectService.createProject(minimalData);

      expect(savedProject.artStyle.referenceImages).toEqual([]);
      expect(savedProject.artStyle.styleKeywords).toEqual([]);
    });
  });

  describe('Validation Errors', () => {
    it('should require name field', async () => {
      const projectData = { ...validProjectData };
      delete (projectData as any).name;

      await expect(projectService.createProject(projectData as any)).rejects.toThrow();
    });

    it('should require description field', async () => {
      const projectData = { ...validProjectData };
      delete (projectData as any).description;

      await expect(projectService.createProject(projectData as any)).rejects.toThrow();
    });

    it('should require context field', async () => {
      const projectData = { ...validProjectData };
      delete (projectData as any).context;

      await expect(projectService.createProject(projectData as any)).rejects.toThrow();
    });

    it('should require art style description', async () => {
      const projectData = { ...validProjectData };
      delete (projectData.artStyle as any).description;

      await expect(projectService.createProject(projectData as any)).rejects.toThrow();
    });

    it('should validate name length constraints', async () => {
      const projectData = { ...validProjectData };
      projectData.name = '';

      await expect(projectService.createProject(projectData)).rejects.toThrow();

      projectData.name = 'a'.repeat(101);
      await expect(projectService.createProject(projectData)).rejects.toThrow();
    });

    it('should validate description length constraints', async () => {
      const projectData = { ...validProjectData };
      projectData.description = 'a'.repeat(501);

      await expect(projectService.createProject(projectData)).rejects.toThrow();
    });

    it('should validate context length constraints', async () => {
      const projectData = { ...validProjectData };
      projectData.context = 'a'.repeat(1001);

      await expect(projectService.createProject(projectData)).rejects.toThrow();
    });

    it('should validate art style description length', async () => {
      const projectData = { ...validProjectData };
      projectData.artStyle.description = 'a'.repeat(2001);

      await expect(projectService.createProject(projectData)).rejects.toThrow();
    });
  });

  describe('Project Operations', () => {
    it('should get project by ID', async () => {
      const savedProject = await projectService.createProject(validProjectData);
      const retrievedProject = await projectService.getProjectById(savedProject.id);

      expect(retrievedProject).toEqual(savedProject);
    });

    it('should return null for non-existent project', async () => {
      const retrievedProject = await projectService.getProjectById('non-existent-id');
      expect(retrievedProject).toBeNull();
    });

    it('should update project', async () => {
      const savedProject = await projectService.createProject(validProjectData);
      const updates = { name: 'Updated Project Name' };
      
      const updatedProject = await projectService.updateProject(savedProject.id, updates);
      
      expect(updatedProject?.name).toBe('Updated Project Name');
      expect(updatedProject?.updatedAt).not.toBe(savedProject.updatedAt);
    });

    it('should delete project', async () => {
      const savedProject = await projectService.createProject(validProjectData);
      const deleted = await projectService.deleteProject(savedProject.id);
      
      expect(deleted).toBe(true);
      
      const retrievedProject = await projectService.getProjectById(savedProject.id);
      expect(retrievedProject).toBeNull();
    });

    it('should get all projects', async () => {
      await projectService.createProject(validProjectData);
      await projectService.createProject({ ...validProjectData, name: 'Project 2' });
      
      const projects = await projectService.getAllProjects();
      expect(projects).toHaveLength(2);
    });
  });
});