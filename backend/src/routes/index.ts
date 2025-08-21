import { Router } from 'express';
import { projectRoutes } from './projects';
import { assetRoutes } from './assets';
import { generationRoutes } from './generation';
import promptRoutes from './prompts';

const router = Router();

// Mount project routes
router.use('/projects', projectRoutes);

// Mount asset routes
router.use('/assets', assetRoutes);

// Mount generation routes
router.use('/generate', generationRoutes);

// Mount prompt routes
router.use('/prompts', promptRoutes);

export { router as apiRoutes };