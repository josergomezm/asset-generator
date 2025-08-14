import { Router } from 'express';
import { assetController } from '../controllers/AssetController';

const router = Router();

// Asset routes
router.get('/:id', assetController.getAssetById.bind(assetController));
router.put('/:id', assetController.updateAsset.bind(assetController));
router.delete('/:id', assetController.deleteAsset.bind(assetController));
router.get('/:id/download', assetController.downloadAsset.bind(assetController));

export { router as assetRoutes };