import { Router } from 'express';
import { projectRoutes } from './projects';
import { assetRoutes } from './assets';
import { generationRoutes } from './generation';

const router = Router();

// Mount project routes
router.use('/projects', projectRoutes);

// Mount asset routes
router.use('/assets', assetRoutes);

// Mount generation routes
router.use('/generate', generationRoutes);

export { router as apiRoutes };