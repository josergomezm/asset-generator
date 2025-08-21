import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface FileManagerOptions {
  dataDir?: string;
  enableBackups?: boolean;
  maxBackups?: number;
}

export class FileManager {
  private dataDir: string;
  private enableBackups: boolean;
  private maxBackups: number;

  constructor(options: FileManagerOptions = {}) {
    this.dataDir = options.dataDir || path.join(process.cwd(), 'data');
    this.enableBackups = options.enableBackups ?? true;
    this.maxBackups = options.maxBackups ?? 5;
  }

  /**
   * Initialize the data directory structure
   */
  async initialize(): Promise<void> {
    try {
      await this.ensureDirectoryExists(this.dataDir);
      await this.ensureDirectoryExists(path.join(this.dataDir, 'projects'));
      await this.ensureDirectoryExists(path.join(this.dataDir, 'jobs'));
      
      // Initialize index files if they don't exist
      const projectsIndexPath = path.join(this.dataDir, 'projects', 'projects.json');
      const jobsIndexPath = path.join(this.dataDir, 'jobs', 'generation-jobs.json');
      
      if (!(await this.fileExists(projectsIndexPath))) {
        await this.writeJSON(projectsIndexPath, []);
      }
      
      if (!(await this.fileExists(jobsIndexPath))) {
        await this.writeJSON(jobsIndexPath, []);
      }
      
      console.log('FileManager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize FileManager:', error);
      throw error;
    }
  }

  /**
   * Generate a new UUID
   */
  generateId(): string {
    return uuidv4();
  }

  /**
   * Get current ISO timestamp
   */
  getCurrentTimestamp(): string {
    return new Date().toISOString();
  }

  /**
   * Read JSON file with error handling and recovery
   */
  async readJSON<T>(filePath: string): Promise<T> {
    const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(this.dataDir, filePath);
    
    try {
      const data = await fs.readFile(absolutePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(`File not found: ${filePath}`);
      }
      
      // If JSON parsing fails, try to recover from backup
      if (error instanceof SyntaxError && this.enableBackups) {
        try {
          const backupData = await this.tryRecoverFromBackup<T>(absolutePath);
          if (backupData) {
            console.warn(`Recovered corrupted file ${filePath} from backup`);
            // Write the recovered data back
            await this.writeJSON(filePath, backupData);
            return backupData;
          }
        } catch (backupError) {
          console.warn(`Failed to recover from backup for ${filePath}:`, backupError);
        }
      }
      
      throw new Error(`Failed to read JSON file ${filePath}: ${(error as Error).message}`);
    }
  }

  /**
   * Write JSON file with atomic operations and backup
   */
  async writeJSON<T>(filePath: string, data: T): Promise<void> {
    const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(this.dataDir, filePath);
    
    try {
      // Ensure directory exists
      await this.ensureDirectoryExists(path.dirname(absolutePath));
      
      // Create backup if file exists and backups are enabled
      if (this.enableBackups && await this.fileExists(absolutePath)) {
        await this.createBackup(absolutePath);
      }
      
      const jsonData = JSON.stringify(data, null, 2);
      
      // In test environment or when backups are disabled, use direct write
      if (!this.enableBackups || process.env.NODE_ENV === 'test') {
        await fs.writeFile(absolutePath, jsonData, 'utf-8');
        return;
      }
      
      // For production, use atomic write with temp file
      const tempPath = `${absolutePath}.tmp`;
      
      try {
        // Write to temporary file first
        await fs.writeFile(tempPath, jsonData, 'utf-8');
        
        // On Windows, handle the rename operation carefully
        if (await this.fileExists(absolutePath)) {
          try {
            await fs.unlink(absolutePath);
          } catch (unlinkError) {
            // If we can't remove the file, try direct overwrite
            try {
              await fs.copyFile(tempPath, absolutePath);
              await fs.unlink(tempPath);
              return;
            } catch (copyError) {
              throw new Error(`Failed to overwrite file: ${(copyError as Error).message}`);
            }
          }
        }
        
        // Move temp file to final location
        await fs.rename(tempPath, absolutePath);
      } catch (error) {
        // Clean up temp file if it exists
        try {
          if (await this.fileExists(tempPath)) {
            await fs.unlink(tempPath);
          }
        } catch {
          // Ignore cleanup errors
        }
        throw error;
      }
    } catch (error) {
      throw new Error(`Failed to write JSON file ${filePath}: ${(error as Error).message}`);
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(this.dataDir, filePath);
      await fs.access(absolutePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Delete file
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(this.dataDir, filePath);
      
      // Create backup before deletion if enabled
      if (this.enableBackups && await this.fileExists(absolutePath)) {
        await this.createBackup(absolutePath);
      }
      
      await fs.unlink(absolutePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw new Error(`Failed to delete file ${filePath}: ${(error as Error).message}`);
      }
    }
  }

  /**
   * Write text content to file
   */
  async writeFile(filePath: string, content: string, encoding: BufferEncoding = 'utf-8'): Promise<void> {
    try {
      const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(this.dataDir, filePath);
      
      // Ensure directory exists
      await this.ensureDirectoryExists(path.dirname(absolutePath));
      
      // Create backup if file exists and backups are enabled
      if (this.enableBackups && await this.fileExists(absolutePath)) {
        await this.createBackup(absolutePath);
      }
      
      await fs.writeFile(absolutePath, content, encoding);
    } catch (error) {
      throw new Error(`Failed to write file ${filePath}: ${(error as Error).message}`);
    }
  }

  /**
   * Delete directory recursively
   */
  async deleteDirectory(dirPath: string): Promise<void> {
    try {
      const absolutePath = path.isAbsolute(dirPath) ? dirPath : path.join(this.dataDir, dirPath);
      await fs.rm(absolutePath, { recursive: true, force: true });
    } catch (error) {
      throw new Error(`Failed to delete directory ${dirPath}: ${(error as Error).message}`);
    }
  }

  /**
   * List files in directory
   */
  async listFiles(dirPath: string): Promise<string[]> {
    try {
      const absolutePath = path.isAbsolute(dirPath) ? dirPath : path.join(this.dataDir, dirPath);
      const files = await fs.readdir(absolutePath);
      return files.filter(file => !file.startsWith('.'));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw new Error(`Failed to list files in ${dirPath}: ${(error as Error).message}`);
    }
  }

  /**
   * Ensure directory exists
   */
  async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      const absolutePath = path.isAbsolute(dirPath) ? dirPath : path.join(this.dataDir, dirPath);
      await fs.mkdir(absolutePath, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to create directory ${dirPath}: ${(error as Error).message}`);
    }
  }

  /**
   * Create backup of file
   */
  private async createBackup(filePath: string): Promise<void> {
    try {
      const backupDir = path.join(path.dirname(filePath), '.backups');
      await this.ensureDirectoryExists(backupDir);
      
      const fileName = path.basename(filePath);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(backupDir, `${fileName}.${timestamp}.backup`);
      
      await fs.copyFile(filePath, backupPath);
      
      // Clean up old backups
      await this.cleanupOldBackups(backupDir, fileName);
    } catch (error) {
      console.warn(`Failed to create backup for ${filePath}:`, error);
      // Don't throw error for backup failures
    }
  }

  /**
   * Try to recover data from the most recent backup
   */
  private async tryRecoverFromBackup<T>(filePath: string): Promise<T | null> {
    try {
      const backupDir = path.join(path.dirname(filePath), '.backups');
      const fileName = path.basename(filePath);
      
      if (!(await this.fileExists(backupDir))) {
        return null;
      }
      
      const files = await fs.readdir(backupDir);
      const backupFiles = files
        .filter(file => file.startsWith(`${fileName}.`) && file.endsWith('.backup'))
        .map(file => ({
          name: file,
          path: path.join(backupDir, file),
          time: file.split('.').slice(-2, -1)[0] // Extract timestamp
        }))
        .sort((a, b) => b.time.localeCompare(a.time)); // Sort by timestamp descending
      
      if (backupFiles.length === 0) {
        return null;
      }
      
      // Try to read the most recent backup
      const mostRecentBackup = backupFiles[0];
      const backupData = await fs.readFile(mostRecentBackup.path, 'utf-8');
      return JSON.parse(backupData) as T;
    } catch (error) {
      console.warn(`Failed to recover from backup:`, error);
      return null;
    }
  }

  /**
   * Clean up old backup files
   */
  private async cleanupOldBackups(backupDir: string, fileName: string): Promise<void> {
    try {
      const files = await fs.readdir(backupDir);
      const backupFiles = files
        .filter(file => file.startsWith(`${fileName}.`) && file.endsWith('.backup'))
        .map(file => ({
          name: file,
          path: path.join(backupDir, file),
          time: file.split('.').slice(-2, -1)[0] // Extract timestamp
        }))
        .sort((a, b) => b.time.localeCompare(a.time)); // Sort by timestamp descending
      
      // Remove old backups beyond maxBackups limit
      if (backupFiles.length > this.maxBackups) {
        const filesToDelete = backupFiles.slice(this.maxBackups);
        for (const file of filesToDelete) {
          await fs.unlink(file.path);
        }
      }
    } catch (error) {
      console.warn(`Failed to cleanup old backups in ${backupDir}:`, error);
    }
  }

  /**
   * Get data directory path
   */
  getDataDir(): string {
    return this.dataDir;
  }

  /**
   * Get project directory path
   */
  getProjectDir(projectId: string): string {
    return path.join(this.dataDir, 'projects', projectId);
  }

  /**
   * Get asset directory path
   */
  getAssetDir(projectId: string): string {
    return path.join(this.getProjectDir(projectId), 'assets');
  }

  /**
   * Get asset files directory path
   */
  getAssetFilesDir(projectId: string): string {
    return path.join(this.getAssetDir(projectId), 'files');
  }
}

// Export singleton instance
export const fileManager = new FileManager();