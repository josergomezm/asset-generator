import { FileManager } from '../services/FileManager';
import path from 'path';
import fs from 'fs/promises';

let testFileManager: FileManager;
let testDataDir: string;

global.beforeAll(async () => {
  // Create a temporary test data directory
  testDataDir = path.join(process.cwd(), 'test-data');
  testFileManager = new FileManager({ 
    dataDir: testDataDir,
    enableBackups: false // Disable backups for tests
  });
  
  await testFileManager.initialize();
});

global.afterAll(async () => {
  // Clean up test data directory
  try {
    await fs.rm(testDataDir, { recursive: true, force: true });
  } catch (error) {
    console.warn('Failed to clean up test data directory:', error);
  }
});

global.afterEach(async () => {
  // Clean up test data between tests
  try {
    await fs.rm(testDataDir, { recursive: true, force: true });
    await testFileManager.initialize();
  } catch (error) {
    console.warn('Failed to clean up test data:', error);
  }
});

// Export test file manager for use in tests
export { testFileManager };