import { Router } from 'express';
import { projectController } from '../controllers/ProjectController';
import { assetController } from '../controllers/AssetController';
import { validate, CommonParams, upload } from '../middleware';
import { z } from 'zod';
import { 
  CreateProjectRequestSchema, 
  UpdateProjectRequestSchema,
  CreateAssetRequestSchema
} from '@asset-tool/types';

const router = Router();

/**
 * GET /api/projects
 * Get all projects
 */
router.get('/', projectController.getAllProjects.bind(projectController));

/**
 * POST /api/projects
 * Create new project
 */
router.post(
  '/',
  validate({ body: CreateProjectRequestSchema }),
  projectController.createProject.bind(projectController)
);

/**
 * GET /api/projects/:id
 * Get project by ID
 */
router.get(
  '/:id',
  validate({ params: CommonParams.id }),
  projectController.getProjectById.bind(projectController)
);

/**
 * PUT /api/projects/:id
 * Update project
 */
router.put(
  '/:id',
  validate({ 
    params: CommonParams.id,
    body: UpdateProjectRequestSchema 
  }),
  projectController.updateProject.bind(projectController)
);

/**
 * DELETE /api/projects/:id
 * Delete project
 */
router.delete(
  '/:id',
  validate({ params: CommonParams.id }),
  projectController.deleteProject.bind(projectController)
);

/**
 * POST /api/projects/:id/style
 * Upload style reference images
 */
router.post(
  '/:id/style',
  validate({ params: CommonParams.id }),
  upload.array('images', 5), // Allow up to 5 images
  projectController.uploadStyleImages.bind(projectController)
);

/**
 * GET /api/projects/:projectId/assets
 * Get all assets for a project
 */
router.get(
  '/:projectId/assets',
  validate({ params: CommonParams.projectId }),
  assetController.getProjectAssets.bind(assetController)
);

/**
 * POST /api/projects/:projectId/assets
 * Create new asset for a project
 */
router.post(
  '/:projectId/assets',
  validate({ 
    params: CommonParams.projectId,
    body: CreateAssetRequestSchema 
  }),
  assetController.createAsset.bind(assetController)
);

export { router as projectRoutes };