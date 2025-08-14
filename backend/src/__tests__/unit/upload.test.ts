import { processStyleImages } from '../../middleware/upload';
import path from 'path';
import fs from 'fs/promises';

describe('Upload Middleware', () => {
  const testProjectId = 'test-project-123';
  
  afterEach(async () => {
    // Clean up test files
    try {
      const testDir = path.join(process.cwd(), 'data', 'projects', testProjectId);
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('processStyleImages', () => {
    it('should process and save image files', async () => {
      // Create a simple test image buffer (1x1 pixel PNG)
      const testImageBuffer = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
        0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
        0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
      ]);

      const mockFiles: Express.Multer.File[] = [
        {
          fieldname: 'images',
          originalname: 'test-image.png',
          encoding: '7bit',
          mimetype: 'image/png',
          buffer: testImageBuffer,
          size: testImageBuffer.length,
          destination: '',
          filename: '',
          path: '',
          stream: {} as any
        }
      ];

      const result = await processStyleImages(mockFiles, testProjectId);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatch(/^style\/.*\.jpg$/);

      // Verify file was actually created
      const imagePath = result[0];
      const fullPath = path.join(process.cwd(), 'data', 'projects', testProjectId, imagePath);
      const fileExists = await fs.access(fullPath).then(() => true).catch(() => false);
      expect(fileExists).toBe(true);
    });

    it('should process multiple image files', async () => {
      const testImageBuffer = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
        0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
        0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
      ]);

      const mockFiles: Express.Multer.File[] = [
        {
          fieldname: 'images',
          originalname: 'test-image-1.png',
          encoding: '7bit',
          mimetype: 'image/png',
          buffer: testImageBuffer,
          size: testImageBuffer.length,
          destination: '',
          filename: '',
          path: '',
          stream: {} as any
        },
        {
          fieldname: 'images',
          originalname: 'test-image-2.png',
          encoding: '7bit',
          mimetype: 'image/png',
          buffer: testImageBuffer,
          size: testImageBuffer.length,
          destination: '',
          filename: '',
          path: '',
          stream: {} as any
        }
      ];

      const result = await processStyleImages(mockFiles, testProjectId);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatch(/^style\/.*\.jpg$/);
      expect(result[1]).toMatch(/^style\/.*\.jpg$/);
      expect(result[0]).not.toBe(result[1]); // Should have different filenames
    });

    it('should handle processing errors gracefully', async () => {
      const invalidBuffer = Buffer.from('not an image');

      const mockFiles: Express.Multer.File[] = [
        {
          fieldname: 'images',
          originalname: 'invalid.txt',
          encoding: '7bit',
          mimetype: 'image/png', // Lying about mimetype
          buffer: invalidBuffer,
          size: invalidBuffer.length,
          destination: '',
          filename: '',
          path: '',
          stream: {} as any
        }
      ];

      await expect(processStyleImages(mockFiles, testProjectId)).rejects.toThrow('Failed to process images');
    });
  });
});