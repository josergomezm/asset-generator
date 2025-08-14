import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import fs from 'fs/promises';
import { AppError } from './errorHandler';

// Configure multer for memory storage (we'll process with Sharp)
const storage = multer.memoryStorage();

// File filter for images only
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check if file is an image
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new AppError('Only image files are allowed', 400, 'INVALID_FILE_TYPE'));
  }
};

// Create multer instance
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files at once
  }
});

/**
 * Process and save uploaded images
 * Resizes images and saves them to the project's style directory
 */
export const processStyleImages = async (
  files: Express.Multer.File[],
  projectId: string
): Promise<string[]> => {
  const processedFiles: string[] = [];
  
  try {
    // Ensure the project style directory exists
    const styleDir = path.join(process.cwd(), 'data', 'projects', projectId, 'style');
    await fs.mkdir(styleDir, { recursive: true });

    for (const file of files) {
      // Generate unique filename (always use .jpg since we convert to JPEG)
      const fileId = uuidv4();
      const filename = `${fileId}.jpg`;
      const filepath = path.join(styleDir, filename);

      // Process image with Sharp
      await sharp(file.buffer)
        .resize(1024, 1024, { 
          fit: 'inside', 
          withoutEnlargement: true 
        })
        .jpeg({ 
          quality: 85,
          progressive: true 
        })
        .toFile(filepath);

      // Store relative path for database (use forward slashes for consistency)
      const relativePath = `style/${filename}`;
      processedFiles.push(relativePath);
    }

    return processedFiles;
  } catch (error) {
    // Clean up any files that were successfully processed
    for (const filePath of processedFiles) {
      try {
        const fullPath = path.join(process.cwd(), 'data', 'projects', projectId, filePath);
        await fs.unlink(fullPath);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    }
    
    throw new AppError('Failed to process images', 500, 'IMAGE_PROCESSING_ERROR');
  }
};

/**
 * Delete style reference images
 */
export const deleteStyleImages = async (
  imagePaths: string[],
  projectId: string
): Promise<void> => {
  for (const imagePath of imagePaths) {
    try {
      const fullPath = path.join(process.cwd(), 'data', 'projects', projectId, imagePath);
      await fs.unlink(fullPath);
    } catch (error) {
      console.error(`Error deleting style image ${imagePath}:`, error);
      // Continue with other files even if one fails
    }
  }
};