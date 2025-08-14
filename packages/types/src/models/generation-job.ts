import { z } from 'zod';

// Generation Job Schema (Zod)
export const GenerationJobSchema = z.object({
  id: z.string(), // UUID instead of MongoDB ObjectId
  assetId: z.string(),
  status: z.enum(['queued', 'processing', 'completed', 'failed']),
  progress: z.number().min(0).max(100),
  errorMessage: z.string().optional(),
  createdAt: z.string().datetime(), // ISO string for JSON compatibility
  completedAt: z.string().datetime().optional()
});

export type GenerationJob = z.infer<typeof GenerationJobSchema>;