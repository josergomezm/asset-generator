import { Request, Response } from 'express';
import { 
  CreateAssetRequestSchema, 
  UpdateAssetRequestSchema,
  AssetResponse,
  AssetListResponse 
} from '@asset-tool/types';
import { assetService } from '../services/AssetService';
import { fileManager } from '../services/FileManager';
import path from 'path';

export class AssetController {
  /**
   * Get all assets for a project
   * GET /api/projects/:projectId/assets
   */
  async getProjectAssets(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;
      
      if (!projectId) {
        res.status(400).json({
          error: {
            code: 'MISSING_PROJECT_ID',
            message: 'Project ID is required',
            timestamp: new Date().toISOString()
          }
        });
        return;
      }

      const assets = await assetService.getProjectAssets(projectId);
      const response: AssetListResponse = assets;
      
      res.json(response);
    } catch (error) {
      console.error('Error getting project assets:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve project assets',
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Get asset by ID
   * GET /api/assets/:id
   */
  async getAssetById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({
          error: {
            code: 'MISSING_ASSET_ID',
            message: 'Asset ID is required',
            timestamp: new Date().toISOString()
          }
        });
        return;
      }

      const asset = await assetService.getAssetById(id);
      
      if (!asset) {
        res.status(404).json({
          error: {
            code: 'ASSET_NOT_FOUND',
            message: 'Asset not found',
            timestamp: new Date().toISOString()
          }
        });
        return;
      }

      const response: AssetResponse = asset;
      res.json(response);
    } catch (error) {
      console.error('Error getting asset:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve asset',
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Create new asset
   * POST /api/projects/:projectId/assets
   */
  async createAsset(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;
      
      if (!projectId) {
        res.status(400).json({
          error: {
            code: 'MISSING_PROJECT_ID',
            message: 'Project ID is required',
            timestamp: new Date().toISOString()
          }
        });
        return;
      }

      // Validate request body
      const validationResult = CreateAssetRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid asset data',
            details: validationResult.error.errors,
            timestamp: new Date().toISOString()
          }
        });
        return;
      }

      const assetData = {
        ...validationResult.data,
        projectId,
        status: 'pending' as const // Default status for new assets
      };

      const asset = await assetService.createAsset(assetData);
      const response: AssetResponse = asset;
      
      res.status(201).json(response);
    } catch (error) {
      console.error('Error creating asset:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create asset',
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Update asset
   * PUT /api/assets/:id
   */
  async updateAsset(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({
          error: {
            code: 'MISSING_ASSET_ID',
            message: 'Asset ID is required',
            timestamp: new Date().toISOString()
          }
        });
        return;
      }

      // Validate request body
      const validationResult = UpdateAssetRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid asset update data',
            details: validationResult.error.errors,
            timestamp: new Date().toISOString()
          }
        });
        return;
      }

      const updatedAsset = await assetService.updateAsset(id, validationResult.data);
      
      if (!updatedAsset) {
        res.status(404).json({
          error: {
            code: 'ASSET_NOT_FOUND',
            message: 'Asset not found',
            timestamp: new Date().toISOString()
          }
        });
        return;
      }

      const response: AssetResponse = updatedAsset;
      res.json(response);
    } catch (error) {
      console.error('Error updating asset:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update asset',
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Delete asset
   * DELETE /api/assets/:id
   */
  async deleteAsset(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({
          error: {
            code: 'MISSING_ASSET_ID',
            message: 'Asset ID is required',
            timestamp: new Date().toISOString()
          }
        });
        return;
      }

      const deleted = await assetService.deleteAsset(id);
      
      if (!deleted) {
        res.status(404).json({
          error: {
            code: 'ASSET_NOT_FOUND',
            message: 'Asset not found',
            timestamp: new Date().toISOString()
          }
        });
        return;
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting asset:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete asset',
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Download asset file
   * GET /api/assets/:id/download
   */
  async downloadAsset(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({
          error: {
            code: 'MISSING_ASSET_ID',
            message: 'Asset ID is required',
            timestamp: new Date().toISOString()
          }
        });
        return;
      }

      const asset = await assetService.getAssetById(id);
      
      if (!asset) {
        res.status(404).json({
          error: {
            code: 'ASSET_NOT_FOUND',
            message: 'Asset not found',
            timestamp: new Date().toISOString()
          }
        });
        return;
      }

      if (!asset.filePath) {
        res.status(404).json({
          error: {
            code: 'FILE_NOT_FOUND',
            message: 'Asset file not found',
            timestamp: new Date().toISOString()
          }
        });
        return;
      }

      // Construct the full file path
      const fullFilePath = path.join(
        fileManager.getDataDir(),
        'projects',
        asset.projectId,
        'assets',
        'files',
        path.basename(asset.filePath)
      );

      // Check if file exists
      if (!(await fileManager.fileExists(path.relative(fileManager.getDataDir(), fullFilePath)))) {
        res.status(404).json({
          error: {
            code: 'FILE_NOT_FOUND',
            message: 'Asset file not found on disk',
            timestamp: new Date().toISOString()
          }
        });
        return;
      }

      // Set appropriate headers for download
      const fileName = asset.name + path.extname(asset.filePath);
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      
      // Set content type based on asset type and file extension
      const ext = path.extname(asset.filePath).toLowerCase();
      if (asset.type === 'image') {
        if (ext === '.png') res.setHeader('Content-Type', 'image/png');
        else if (ext === '.jpg' || ext === '.jpeg') res.setHeader('Content-Type', 'image/jpeg');
        else if (ext === '.gif') res.setHeader('Content-Type', 'image/gif');
        else if (ext === '.webp') res.setHeader('Content-Type', 'image/webp');
        else res.setHeader('Content-Type', 'application/octet-stream');
      } else if (asset.type === 'video') {
        if (ext === '.mp4') res.setHeader('Content-Type', 'video/mp4');
        else if (ext === '.webm') res.setHeader('Content-Type', 'video/webm');
        else if (ext === '.avi') res.setHeader('Content-Type', 'video/avi');
        else res.setHeader('Content-Type', 'application/octet-stream');
      } else {
        res.setHeader('Content-Type', 'application/octet-stream');
      }

      // Send file
      res.sendFile(fullFilePath);
    } catch (error) {
      console.error('Error downloading asset:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to download asset',
          timestamp: new Date().toISOString()
        }
      });
    }
  }
}

// Export singleton instance
export const assetController = new AssetController();