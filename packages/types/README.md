# @asset-tool/types

Shared TypeScript types and Zod schemas for the Asset Generation Tool.

## Installation

```bash
npm install @asset-tool/types
```

## Usage

### Import schemas and types

```typescript
import { 
  ProjectSchema, 
  AssetSchema, 
  CreateProjectRequest,
  GenerateImageRequest,
  z 
} from '@asset-tool/types';

// Validate data
const project = ProjectSchema.parse(projectData);

// Use types
const createRequest: CreateProjectRequest = {
  name: "My Project",
  description: "A test project",
  context: "Game development",
  artStyle: {
    description: "Pixel art style",
    referenceImages: [],
    styleKeywords: ["pixel", "retro", "8bit"]
  }
};
```

### Available Schemas

#### Models
- `ProjectSchema` - Project data model
- `AssetSchema` - Asset data model  
- `GenerationJobSchema` - Generation job tracking

#### API Schemas
- `CreateProjectRequestSchema` - Project creation requests
- `UpdateProjectRequestSchema` - Project update requests
- `CreateAssetRequestSchema` - Asset creation requests
- `GenerateImageRequestSchema` - Image generation requests
- `GenerateVideoRequestSchema` - Video generation requests
- `ErrorResponseSchema` - Error response format
- `GenerationStatusResponseSchema` - Generation status responses

## Development

```bash
# Build the package
npm run build

# Watch for changes
npm run dev

# Clean build artifacts
npm run clean
```