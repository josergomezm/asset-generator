import { z } from 'zod';
import { ProjectSchema } from '../models/project';

// API validation schemas for Project endpoints
export const CreateProjectRequestSchema = ProjectSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const UpdateProjectRequestSchema = CreateProjectRequestSchema.partial();

export const ProjectResponseSchema = ProjectSchema;

export const ProjectListResponseSchema = z.array(ProjectResponseSchema);

// Type exports
export type CreateProjectRequest = z.infer<typeof CreateProjectRequestSchema>;
export type UpdateProjectRequest = z.infer<typeof UpdateProjectRequestSchema>;
export type ProjectResponse = z.infer<typeof ProjectResponseSchema>;
export type ProjectListResponse = z.infer<typeof ProjectListResponseSchema>;