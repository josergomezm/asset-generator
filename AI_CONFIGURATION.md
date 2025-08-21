# AI Configuration System

This document explains how to set up and use the AI configuration system for asset generation.

## Overview

The AI configuration system allows users to configure their own AI providers and API keys directly in the frontend. The configuration is stored in the browser's localStorage and passed to the backend via HTTP headers for secure processing.

## Features

- **Frontend Configuration**: Users can configure AI providers and models through a user-friendly interface
- **Secure Storage**: API keys are stored locally in the browser and never sent to your servers
- **Multiple Providers**: Support for OpenAI, Stability AI, Replicate, and Anthropic
- **Asset Type Mapping**: Different AI configurations for images, videos, and prompts
- **Real-time Validation**: Test API keys before saving
- **Fallback Mode**: Simulation mode when no AI configuration is provided

## Supported Providers

### OpenAI
- **Models**: DALL-E 3, DALL-E 2 (images), GPT-4, GPT-3.5 Turbo (text)
- **API Key Format**: `sk-...`
- **Use Cases**: Image generation, prompt enhancement

### Stability AI
- **Models**: Stable Diffusion XL (images), Stable Video Diffusion (videos)
- **API Key Format**: `sk-...`
- **Use Cases**: Image generation, video generation

### Replicate
- **Models**: SDXL, RunwayML Gen-2
- **API Key Format**: `r8_...`
- **Use Cases**: Image generation, video generation

### Anthropic
- **Models**: Claude 3 Opus, Claude 3 Sonnet
- **API Key Format**: `sk-ant-...`
- **Use Cases**: Prompt enhancement

## How It Works

### Frontend Flow
1. User opens AI Configuration modal from the navigation bar
2. User selects provider and model for each asset type (image, video, prompt)
3. User enters their API key for each provider
4. Configuration is saved to localStorage
5. When making generation requests, the frontend includes AI headers

### Backend Flow
1. Backend receives generation request with AI headers:
   - `X-AI-Provider`: Provider name (e.g., "openai")
   - `X-AI-Model`: Model name (e.g., "dall-e-3")
   - `X-AI-API-Key`: User's API key
2. Backend extracts AI configuration from headers
3. Backend calls appropriate AI service with user's credentials
4. Generated content is processed and saved

## Configuration Interface

### AI Configuration Modal
- Accessible from navigation bar "AI Config" button
- Shows configuration status with colored indicators
- Separate sections for each asset type
- Real-time validation and testing

### Configuration Sections
- **Image Generation**: Configure provider/model for image assets
- **Video Generation**: Configure provider/model for video assets  
- **Prompt Enhancement**: Configure provider/model for text prompts

### Status Indicators
- Green dot: Configuration complete and valid
- Gray dot: Configuration incomplete or missing
- Test button: Validate API key with a test request

## Implementation Details

### Frontend Components
- `AIConfigModal.vue`: Main configuration interface
- `AIConfigSection.vue`: Individual provider/model configuration
- `AIConfigWarning.vue`: Warning shown when no configuration exists
- `aiConfig.ts`: Pinia store for managing configuration state

### Backend Services
- `GenerationController.ts`: Extracts AI headers from requests
- `AssetGenerationService.ts`: Routes to appropriate AI service
- `ai/OpenAIService.ts`: Example OpenAI integration

### API Headers
```typescript
{
  'X-AI-Provider': 'openai',
  'X-AI-Model': 'dall-e-3', 
  'X-AI-API-Key': 'sk-...'
}
```

## Adding New Providers

### 1. Update Frontend Configuration
Add new provider to `AI_PROVIDERS` array in `aiConfig.ts`:

```typescript
{
  id: 'newprovider',
  name: 'New Provider',
  requiresApiKey: true,
  keyLabel: 'API Key',
  keyPlaceholder: 'np-...',
  models: [
    { id: 'model1', name: 'Model 1', type: 'image' }
  ]
}
```

### 2. Create Backend Service
Create new service file `ai/NewProviderService.ts`:

```typescript
export class NewProviderService {
  async generateImage(prompt: string, config: AIConfig): Promise<string> {
    // Implementation
  }
}
```

### 3. Update Generation Service
Add new case to `performAIGeneration` method:

```typescript
case 'newprovider':
  await this.generateWithNewProvider(jobId, prompt, type, aiConfig);
  break;
```

## Security Considerations

- API keys are stored in browser localStorage only
- Keys are transmitted via HTTPS headers to your backend
- Backend never stores or logs API keys
- Each user manages their own credentials
- No shared or server-side API keys

## Environment Setup

No environment variables needed! Users provide their own API keys through the interface.

## Testing

1. Open AI Configuration modal
2. Configure at least one provider with a valid API key
3. Create a new asset and verify the warning disappears
4. Generate an asset and check backend logs for AI service calls
5. Test with invalid API key to verify error handling

## Troubleshooting

### "Configuration Required" Warning
- User needs to configure at least one AI provider
- Click "Configure AI Settings" to open configuration modal

### Generation Fails
- Check API key validity
- Verify provider/model combination is supported
- Check backend logs for detailed error messages

### Simulation Mode
- When no AI configuration is provided, system falls back to simulation
- Useful for testing without API costs
- Shows realistic progress updates but generates placeholder content

## Future Enhancements

- API key encryption in localStorage
- Usage tracking and cost estimation
- Provider-specific parameter configuration
- Batch generation support
- Custom model fine-tuning integration