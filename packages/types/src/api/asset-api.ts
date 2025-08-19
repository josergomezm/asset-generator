import { z } from 'zod';
import { AssetSchema } from '../models/asset';

// API validation schemas for Asset endpoints
export const CreateAssetRequestSchema = AssetSchema.omit({ 
  id: true, 
  createdAt: true, 
  status: true,
  projectId: true // projectId comes from URL parameter, not request body
});

export const UpdateAssetRequestSchema = AssetSchema.pick({
  name: true,
  description: true
}).partial();

export const AssetResponseSchema = AssetSchema;

export const AssetListResponseSchema = z.array(AssetResponseSchema);

// Generation request schemas
export const GenerateImageRequestSchema = z.object({
  projectId: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  prompt: z.string().min(1),
  styleOverride: z.object({
    description: z.string().optional(),
    keywords: z.array(z.string()).optional()
  }).optional(),
  parameters: z.object({
    width: z.number().min(256).max(2048).optional(),
    height: z.number().min(256).max(2048).optional(),
    steps: z.number().min(1).max(100).optional(),
    guidance: z.number().min(1).max(20).optional()
  }).optional()
});

export const GenerateVideoRequestSchema = z.object({
  projectId: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  prompt: z.string().min(1),
  styleOverride: z.object({
    description: z.string().optional(),
    keywords: z.array(z.string()).optional()
  }).optional(),
  parameters: z.object({
    duration: z.number().min(1).max(30).optional(),
    fps: z.number().min(12).max(60).optional(),
    resolution: z.enum(['720p', '1080p', '4k']).optional()
  }).optional()
});

export const GeneratePromptRequestSchema = z.object({
  projectId: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  prompt: z.string().min(1),
  styleOverride: z.object({
    description: z.string().optional(),
    keywords: z.array(z.string()).optional()
  }).optional(),
  parameters: z.object({
    creativity: z.enum(['conservative', 'balanced', 'creative', 'experimental']).optional(),
    length: z.enum(['short', 'medium', 'long']).optional(),
    focus: z.enum(['visual', 'mood', 'technical', 'narrative']).optional(),
    variations: z.number().min(1).max(5).optional()
  }).optional()
});

// Type exports
export type CreateAssetRequest = z.infer<typeof CreateAssetRequestSchema>;
export type UpdateAssetRequest = z.infer<typeof UpdateAssetRequestSchema>;
export type AssetResponse = z.infer<typeof AssetResponseSchema>;
export type AssetListResponse = z.infer<typeof AssetListResponseSchema>;
export type GenerateImageRequest = z.infer<typeof GenerateImageRequestSchema>;
export type GenerateVideoRequest = z.infer<typeof GenerateVideoRequestSchema>;
export type GeneratePromptRequest = z.infer<typeof GeneratePromptRequestSchema>;