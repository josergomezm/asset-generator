import { Asset, AssetSchema } from '@asset-tool/types';
import { fileManager } from './FileManager';
import path from 'path';

export class AssetService {
  /**
   * Get all assets for a project
   */
  async getProjectAssets(projectId: string): Promise<Asset[]> {
    try {
      const assetsIndexPath = path.join('projects', projectId, 'assets.json');
      if (!(await fileManager.fileExists(assetsIndexPath))) {
        return [];
      }
      
      return await fileManager.readJSON<Asset[]>(assetsIndexPath);
    } catch (error) {
      console.error(`Failed to get assets for project ${projectId}:`, error);
      return [];
    }
  }

  /**
   * Get asset by ID
   */
  async getAssetById(assetId: string): Promise<Asset | null> {
    try {
      // Find the asset by searching through all projects
      // This is not the most efficient approach, but works for the JSON file system
      const projectDirs = await fileManager.listFiles('projects');
      
      for (const projectId of projectDirs) {
        if (projectId === 'projects.json') continue; // Skip the index file
        
        const assetPath = path.join('projects', projectId, 'assets', `${assetId}.json`);
        if (await fileManager.fileExists(assetPath)) {
          const asset = await fileManager.readJSON<Asset>(assetPath);
          return AssetSchema.parse(asset);
        }
      }
      
      return null;
    } catch (error) {
      console.error(`Failed to get asset ${assetId}:`, error);
      return null;
    }
  }

  /**
   * Create new asset
   */
  async createAsset(assetData: Omit<Asset, 'id' | 'createdAt'>): Promise<Asset> {
    try {
      const now = fileManager.getCurrentTimestamp();
      const asset: Asset = {
        ...assetData,
        id: fileManager.generateId(),
        createdAt: now
      };

      // Validate asset data
      const validatedAsset = AssetSchema.parse(asset);

      // Ensure project exists
      const projectPath = path.join('projects', validatedAsset.projectId, 'project.json');
      if (!(await fileManager.fileExists(projectPath))) {
        throw new Error(`Project ${validatedAsset.projectId} does not exist`);
      }

      // Save asset data
      const assetPath = path.join('projects', validatedAsset.projectId, 'assets', `${validatedAsset.id}.json`);
      await fileManager.writeJSON(assetPath, validatedAsset);

      // Update assets index
      await this.updateAssetsIndex(validatedAsset.projectId, validatedAsset);

      return validatedAsset;
    } catch (error) {
      console.error('Failed to create asset:', error);
      throw new Error(`Failed to create asset: ${(error as Error).message}`);
    }
  }

  /**
   * Update asset
   */
  async updateAsset(assetId: string, updates: Partial<Omit<Asset, 'id' | 'projectId' | 'createdAt'>>): Promise<Asset | null> {
    try {
      const existingAsset = await this.getAssetById(assetId);
      if (!existingAsset) {
        return null;
      }

      const updatedAsset: Asset = {
        ...existingAsset,
        ...updates,
        id: existingAsset.id, // Ensure ID cannot be changed
        projectId: existingAsset.projectId, // Ensure projectId cannot be changed
        createdAt: existingAsset.createdAt // Ensure createdAt cannot be changed
      };

      // Validate updated asset data
      const validatedAsset = AssetSchema.parse(updatedAsset);

      // Save updated asset data
      const assetPath = path.join('projects', validatedAsset.projectId, 'assets', `${assetId}.json`);
      await fileManager.writeJSON(assetPath, validatedAsset);

      // Update assets index
      await this.updateAssetsIndex(validatedAsset.projectId, validatedAsset);

      return validatedAsset;
    } catch (error) {
      console.error(`Failed to update asset ${assetId}:`, error);
      throw new Error(`Failed to update asset: ${(error as Error).message}`);
    }
  }

  /**
   * Delete asset
   */
  async deleteAsset(assetId: string): Promise<boolean> {
    try {
      const existingAsset = await this.getAssetById(assetId);
      if (!existingAsset) {
        return false;
      }

      // Delete asset file if it exists
      if (existingAsset.filePath) {
        const assetFilePath = path.join('projects', existingAsset.projectId, 'assets', 'files', path.basename(existingAsset.filePath));
        if (await fileManager.fileExists(assetFilePath)) {
          await fileManager.deleteFile(assetFilePath);
        }
      }

      // Delete asset metadata
      const assetPath = path.join('projects', existingAsset.projectId, 'assets', `${assetId}.json`);
      await fileManager.deleteFile(assetPath);

      // Remove from assets index
      await this.removeFromAssetsIndex(existingAsset.projectId, assetId);

      return true;
    } catch (error) {
      console.error(`Failed to delete asset ${assetId}:`, error);
      throw new Error(`Failed to delete asset: ${(error as Error).message}`);
    }
  }

  /**
   * Update assets index with asset data
   */
  private async updateAssetsIndex(projectId: string, asset: Asset): Promise<void> {
    try {
      const assets = await this.getProjectAssets(projectId);
      const existingIndex = assets.findIndex(a => a.id === asset.id);
      
      if (existingIndex >= 0) {
        assets[existingIndex] = asset;
      } else {
        assets.push(asset);
      }

      const assetsIndexPath = path.join('projects', projectId, 'assets.json');
      await fileManager.writeJSON(assetsIndexPath, assets);
    } catch (error) {
      console.error('Failed to update assets index:', error);
      throw error;
    }
  }

  /**
   * Remove asset from assets index
   */
  private async removeFromAssetsIndex(projectId: string, assetId: string): Promise<void> {
    try {
      const assets = await this.getProjectAssets(projectId);
      const filteredAssets = assets.filter(a => a.id !== assetId);
      
      const assetsIndexPath = path.join('projects', projectId, 'assets.json');
      await fileManager.writeJSON(assetsIndexPath, filteredAssets);
    } catch (error) {
      console.error('Failed to remove asset from index:', error);
      throw error;
    }
  }

  /**
   * Get asset file path
   */
  getAssetFilePath(projectId: string, fileName: string): string {
    return fileManager.getAssetFilesDir(projectId) + path.sep + fileName;
  }
}

// Export singleton instance
export const assetService = new AssetService();