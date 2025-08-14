import { Project, ProjectSchema } from '@asset-tool/types';
import { fileManager } from './FileManager';
import path from 'path';

export class ProjectService {
  private projectsIndexPath = 'projects/projects.json';

  /**
   * Get all projects
   */
  async getAllProjects(): Promise<Project[]> {
    try {
      return await fileManager.readJSON<Project[]>(this.projectsIndexPath);
    } catch (error) {
      console.error('Failed to get all projects:', error);
      return [];
    }
  }

  /**
   * Get project by ID
   */
  async getProjectById(id: string): Promise<Project | null> {
    try {
      const projectPath = path.join('projects', id, 'project.json');
      if (!(await fileManager.fileExists(projectPath))) {
        return null;
      }
      
      const project = await fileManager.readJSON<Project>(projectPath);
      
      // Validate project data
      return ProjectSchema.parse(project);
    } catch (error) {
      console.error(`Failed to get project ${id}:`, error);
      return null;
    }
  }

  /**
   * Create new project
   */
  async createProject(projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    try {
      const now = fileManager.getCurrentTimestamp();
      const project: Project = {
        ...projectData,
        id: fileManager.generateId(),
        createdAt: now,
        updatedAt: now
      };

      // Validate project data
      const validatedProject = ProjectSchema.parse(project);

      // Create project directory structure
      const projectDir = fileManager.getProjectDir(validatedProject.id);
      const assetsDir = fileManager.getAssetDir(validatedProject.id);
      const assetFilesDir = fileManager.getAssetFilesDir(validatedProject.id);
      
      await fileManager.ensureDirectoryExists(projectDir);
      await fileManager.ensureDirectoryExists(assetsDir);
      await fileManager.ensureDirectoryExists(assetFilesDir);

      // Save project data
      const projectPath = path.join('projects', validatedProject.id, 'project.json');
      await fileManager.writeJSON(projectPath, validatedProject);

      // Initialize empty assets index
      const assetsIndexPath = path.join('projects', validatedProject.id, 'assets.json');
      await fileManager.writeJSON(assetsIndexPath, []);

      // Update projects index
      await this.updateProjectsIndex(validatedProject);

      return validatedProject;
    } catch (error) {
      console.error('Failed to create project:', error);
      throw new Error(`Failed to create project: ${(error as Error).message}`);
    }
  }

  /**
   * Update project
   */
  async updateProject(id: string, updates: Partial<Omit<Project, 'id' | 'createdAt'>>): Promise<Project | null> {
    try {
      const existingProject = await this.getProjectById(id);
      if (!existingProject) {
        return null;
      }

      const updatedProject: Project = {
        ...existingProject,
        ...updates,
        id: existingProject.id, // Ensure ID cannot be changed
        createdAt: existingProject.createdAt, // Ensure createdAt cannot be changed
        updatedAt: fileManager.getCurrentTimestamp()
      };

      // Validate updated project data
      const validatedProject = ProjectSchema.parse(updatedProject);

      // Save updated project data
      const projectPath = path.join('projects', id, 'project.json');
      await fileManager.writeJSON(projectPath, validatedProject);

      // Update projects index
      await this.updateProjectsIndex(validatedProject);

      return validatedProject;
    } catch (error) {
      console.error(`Failed to update project ${id}:`, error);
      throw new Error(`Failed to update project: ${(error as Error).message}`);
    }
  }

  /**
   * Delete project
   */
  async deleteProject(id: string): Promise<boolean> {
    try {
      const existingProject = await this.getProjectById(id);
      if (!existingProject) {
        return false;
      }

      // Delete project directory and all its contents
      const projectDir = path.join('projects', id);
      await fileManager.deleteDirectory(projectDir);

      // Remove from projects index
      await this.removeFromProjectsIndex(id);

      return true;
    } catch (error) {
      console.error(`Failed to delete project ${id}:`, error);
      throw new Error(`Failed to delete project: ${(error as Error).message}`);
    }
  }

  /**
   * Add style reference images to project
   */
  async addStyleImages(id: string, imagePaths: string[]): Promise<Project | null> {
    try {
      const existingProject = await this.getProjectById(id);
      if (!existingProject) {
        return null;
      }

      // Add new image paths to existing reference images
      const updatedReferenceImages = [
        ...existingProject.artStyle.referenceImages,
        ...imagePaths
      ];

      // Update project with new reference images
      const updatedProject = await this.updateProject(id, {
        artStyle: {
          ...existingProject.artStyle,
          referenceImages: updatedReferenceImages
        }
      });

      return updatedProject;
    } catch (error) {
      console.error(`Failed to add style images to project ${id}:`, error);
      throw new Error(`Failed to add style images: ${(error as Error).message}`);
    }
  }

  /**
   * Update projects index with project data
   */
  private async updateProjectsIndex(project: Project): Promise<void> {
    try {
      const projects = await this.getAllProjects();
      const existingIndex = projects.findIndex(p => p.id === project.id);
      
      if (existingIndex >= 0) {
        projects[existingIndex] = project;
      } else {
        projects.push(project);
      }

      await fileManager.writeJSON(this.projectsIndexPath, projects);
    } catch (error) {
      console.error('Failed to update projects index:', error);
      throw error;
    }
  }

  /**
   * Remove project from projects index
   */
  private async removeFromProjectsIndex(projectId: string): Promise<void> {
    try {
      const projects = await this.getAllProjects();
      const filteredProjects = projects.filter(p => p.id !== projectId);
      await fileManager.writeJSON(this.projectsIndexPath, filteredProjects);
    } catch (error) {
      console.error('Failed to remove project from index:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const projectService = new ProjectService();