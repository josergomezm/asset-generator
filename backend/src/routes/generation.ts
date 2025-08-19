import { Router } from 'express';
import { GenerationController } from '../controllers/GenerationController';
import { validate, CommonParams } from '../middleware/validation';
import { z } from 'zod';

const router = Router();
const generationController = new GenerationController();

// Validation schemas
const generateImageBody = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  generationPrompt: z.string().min(1).max(2000),
  generationParameters: z.record(z.any()).optional(),
  styleOverride: z.object({
    description: z.string().max(2000).optional(),
    keywords: z.array(z.string()).optional()
  }).optional()
});

const generateVideoBody = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  generationPrompt: z.string().min(1).max(2000),
  generationParameters: z.record(z.any()).optional(),
  styleOverride: z.object({
    description: z.string().max(2000).optional(),
    keywords: z.array(z.string()).optional()
  }).optional()
});

const generatePromptBody = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  generationPrompt: z.string().min(1).max(2000),
  generationParameters: z.record(z.any()).optional(),
  styleOverride: z.object({
    description: z.string().max(2000).optional(),
    keywords: z.array(z.string()).optional()
  }).optional()
});

// POST /api/generate/image - Generate image asset
router.post('/image', 
  validate({ body: generateImageBody }),
  generationController.generateImage.bind(generationController)
);

// POST /api/generate/video - Generate video asset
router.post('/video', 
  validate({ body: generateVideoBody }),
  generationController.generateVideo.bind(generationController)
);

// POST /api/generate/prompt - Generate prompt asset
router.post('/prompt', 
  validate({ body: generatePromptBody }),
  generationController.generatePrompt.bind(generationController)
);

// GET /api/generate/status/:jobId - Check generation status
router.get('/status/:jobId',
  validate({ params: CommonParams.jobId }),
  generationController.getGenerationStatus.bind(generationController)
);

// DELETE /api/generate/cancel/:jobId - Cancel generation job
router.delete('/cancel/:jobId',
  validate({ params: CommonParams.jobId }),
  generationController.cancelGeneration.bind(generationController)
);

export { router as generationRoutes };