// Simple test to verify schemas work correctly
import { ProjectSchema, AssetSchema, CreateProjectRequestSchema } from './index';

// Test Project schema
const testProject = {
  name: "Test Project",
  description: "A test project for validation",
  context: "Testing the schema validation",
  artStyle: {
    description: "Modern minimalist style",
    referenceImages: ["image1.jpg", "image2.jpg"],
    styleKeywords: ["modern", "minimalist", "clean"]
  }
};

try {
  const validatedProject = ProjectSchema.parse(testProject);
  console.log("✅ Project schema validation passed");
} catch (error) {
  console.error("❌ Project schema validation failed:", error);
}

// Test Asset schema
const testAsset = {
  projectId: "project123",
  type: "image" as const,
  name: "Test Asset",
  description: "A test asset",
  generationPrompt: "Generate a beautiful landscape",
  generationParameters: { width: 1024, height: 1024 },
  status: "pending" as const,
  metadata: {
    dimensions: { width: 1024, height: 1024 },
    format: "png"
  }
};

try {
  const validatedAsset = AssetSchema.parse(testAsset);
  console.log("✅ Asset schema validation passed");
} catch (error) {
  console.error("❌ Asset schema validation failed:", error);
}

// Test API request schema
const testCreateRequest = {
  name: "API Test Project",
  description: "Testing API request validation",
  context: "API testing context",
  artStyle: {
    description: "Test style",
    referenceImages: [],
    styleKeywords: ["test"]
  }
};

try {
  const validatedRequest = CreateProjectRequestSchema.parse(testCreateRequest);
  console.log("✅ Create project request schema validation passed");
} catch (error) {
  console.error("❌ Create project request schema validation failed:", error);
}

console.log("Schema validation tests completed!");