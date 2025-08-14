import { Request, Response, NextFunction } from 'express';
import { projectService } from '../services/ProjectService';
import { AppError } from '../middleware/errorHandler';
import { processStyleImages } from '../middleware/upload';
import { 
  CreateProjectRequest, 
  UpdateProjectRequest,
  ProjectResponse,
  ProjectListResponse
} from '@asset-tool/types';

export class ProjectController {
  /**
   * Get all projects
   * GET /api/projects
   */
  async getAllProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projects = await projectService.getAllProjects();
      const response: ProjectListResponse = projects;
      res.json(response);
    } catch (error) {
      next(new AppError('Failed to retrieve projects', 500, 'INTERNAL_ERROR'));
    }
  }

  /**
   * Get project by ID
   * GET /api/projects/:id
   */
  async getProjectById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const project = await projectService.getProjectById(id);
      
      if (!project) {
        next(new AppError('Project not found', 404, 'PROJECT_NOT_FOUND'));
        return;
      }

      const response: ProjectResponse = project;
      res.json(response);
    } catch (error) {
      next(new AppError('Failed to retrieve project', 500, 'INTERNAL_ERROR'));
    }
  }

  /**
   * Create new project
   * POST /api/projects
   */
  async createProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectData: CreateProjectRequest = req.body;
      const project = await projectService.createProject(projectData);
      
      const response: ProjectResponse = project;
      res.status(201).json(response);
    } catch (error) {
      if (error instanceof Error && error.message.includes('validation')) {
        next(new AppError('Invalid project data', 400, 'VALIDATION_ERROR'));
      } else {
        next(new AppError('Failed to create project', 500, 'INTERNAL_ERROR'));
      }
    }
  }

  /**
   * Update project
   * PUT /api/projects/:id
   */
  async updateProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updates: UpdateProjectRequest = req.body;
      
      const project = await projectService.updateProject(id, updates);
      
      if (!project) {
        next(new AppError('Project not found', 404, 'PROJECT_NOT_FOUND'));
        return;
      }

      const response: ProjectResponse = project;
      res.json(response);
    } catch (error) {
      if (error instanceof Error && error.message.includes('validation')) {
        next(new AppError('Invalid project data', 400, 'VALIDATION_ERROR'));
      } else {
        next(new AppError('Failed to update project', 500, 'INTERNAL_ERROR'));
      }
    }
  }

  /**
   * Delete project
   * DELETE /api/projects/:id
   */
  async deleteProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await projectService.deleteProject(id);
      
      if (!deleted) {
        next(new AppError('Project not found', 404, 'PROJECT_NOT_FOUND'));
        return;
      }

      res.status(204).send();
    } catch (error) {
      next(new AppError('Failed to delete project', 500, 'INTERNAL_ERROR'));
    }
  }

  /**
   * Upload style reference images
   * POST /api/projects/:id/style
   */
  async uploadStyleImages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const files = req.files as Express.Multer.File[];

      // Check if project exists
      const project = await projectService.getProjectById(id);
      if (!project) {
        next(new AppError('Project not found', 404, 'PROJECT_NOT_FOUND'));
        return;
      }

      // Check if files were uploaded
      if (!files || files.length === 0) {
        next(new AppError('No files uploaded', 400, 'NO_FILES_UPLOADED'));
        return;
      }

      // Process and save images
      const imagePaths = await processStyleImages(files, id);

      // Update project with new reference images
      const updatedProject = await projectService.addStyleImages(id, imagePaths);
      
      if (!updatedProject) {
        next(new AppError('Failed to update project with images', 500, 'INTERNAL_ERROR'));
        return;
      }

      const response: ProjectResponse = updatedProject;
      res.json(response);
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        next(new AppError('Failed to upload style images', 500, 'INTERNAL_ERROR'));
      }
    }
  }
}

// Export singleton instance
export const projectController = new ProjectController();