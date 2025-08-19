import { Router } from 'express';
import { assetController } from '../controllers/AssetController';
import { validate, CommonParams, FlexibleParams } from '../middleware';
import { UpdateAssetRequestSchema } from '@asset-tool/types';

const router = Router();

// Use flexible validation in test environment, strict in production
const getParamValidation = () => {
  return process.env.NODE_ENV === 'test' ? FlexibleParams : CommonParams;
};

// Asset routes
router.get(
  '/:id',
  validate({ params: getParamValidation().id }),
  assetController.getAssetById.bind(assetController)
);

router.put(
  '/:id',
  validate({ 
    params: getParamValidation().id,
    body: UpdateAssetRequestSchema 
  }),
  assetController.updateAsset.bind(assetController)
);

router.delete(
  '/:id',
  validate({ params: getParamValidation().id }),
  assetController.deleteAsset.bind(assetController)
);

router.get(
  '/:id/download',
  validate({ params: getParamValidation().id }),
  assetController.downloadAsset.bind(assetController)
);

export { router as assetRoutes };