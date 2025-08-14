import { z } from 'zod';

// Project Schema (Zod)
export const ProjectSchema = z.object({
  id: z.string(), // UUID instead of MongoDB ObjectId
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  context: z.string().max(1000),
  artStyle: z.object({
    description: z.string().max(2000),
    referenceImages: z.array(z.string()),
    styleKeywords: z.array(z.string())
  }),
  createdAt: z.string().datetime(), // ISO string for JSON compatibility
  updatedAt: z.string().datetime()
});

export type Project = z.infer<typeof ProjectSchema>;