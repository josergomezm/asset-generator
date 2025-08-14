import { z } from 'zod';

// Asset Schema (Zod)
export const AssetSchema = z.object({
  id: z.string(), // UUID instead of MongoDB ObjectId
  projectId: z.string(),
  type: z.enum(['image', 'video', 'prompt']),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  filePath: z.string().optional(),
  generationPrompt: z.string(),
  generationParameters: z.record(z.any()),
  status: z.enum(['pending', 'generating', 'completed', 'failed']),
  createdAt: z.string().datetime(), // ISO string for JSON compatibility
  metadata: z.object({
    dimensions: z.object({
      width: z.number(),
      height: z.number()
    }).optional(),
    duration: z.number().optional(),
    fileSize: z.number().optional(),
    format: z.string().optional()
  })
});

export type Asset = z.infer<typeof AssetSchema>;