import { FileManager } from '../services/FileManager';
import path from 'path';
import fs from 'fs/promises';

let testFileManager: FileManager;
let testDataDir: string;

// Track active async operations to prevent race conditions
const activeOperations = new Set<Promise<any>>();

const waitForOperations = async () => {
  if (activeOperations.size > 0) {
    await Promise.allSettled(Array.from(activeOperations));
    activeOperations.clear();
  }
};

global.beforeAll(async () => {
  // Create a unique test data directory to avoid conflicts
  const timestamp = Date.now();
  testDataDir = path.join(process.cwd(), `test-data-${timestamp}`);
  testFileManager = new FileManager({ 
    dataDir: testDataDir,
    enableBackups: false, // Disable backups for tests
    maxBackups: 0
  });
  
  await testFileManager.initialize();
});

global.afterAll(async () => {
  // Wait for any pending operations
  await waitForOperations();
  
  // Clean up test data directory with retry logic
  let retries = 3;
  while (retries > 0) {
    try {
      await fs.rm(testDataDir, { recursive: true, force: true });
      break;
    } catch (error) {
      retries--;
      if (retries === 0) {
        console.warn('Failed to clean up test data directory after retries:', error);
      } else {
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }
});

global.afterEach(async () => {
  // Wait for any pending operations
  await waitForOperations();
  
  // Clean up test data between tests with retry logic
  let retries = 3;
  while (retries > 0) {
    try {
      await fs.rm(testDataDir, { recursive: true, force: true });
      await testFileManager.initialize();
      break;
    } catch (error) {
      retries--;
      if (retries === 0) {
        console.warn('Failed to clean up test data after retries:', error);
      } else {
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }
});

// Helper to track async operations
export const trackOperation = <T>(operation: Promise<T>): Promise<T> => {
  activeOperations.add(operation);
  operation.finally(() => activeOperations.delete(operation));
  return operation;
};

// Export test file manager for use in tests
export { testFileManager };