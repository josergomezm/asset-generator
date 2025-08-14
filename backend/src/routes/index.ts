import { Router } from 'express';
import { projectRoutes } from './projects';
import { assetRoutes } from './assets';

const router = Router();

// Mount project routes
router.use('/projects', projectRoutes);

// Mount asset routes
router.use('/assets', assetRoutes);

export { router as apiRoutes };