import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { AppError } from './errorHandler';

export interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export const validate = (schemas: ValidationSchemas) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate request body
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }

      // Validate query parameters
      if (schemas.query) {
        req.query = schemas.query.parse(req.query);
      }

      // Validate route parameters
      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(error); // Let error handler deal with Zod errors
      } else {
        next(new AppError('Validation failed', 400, 'VALIDATION_ERROR'));
      }
    }
  };
};

// Common parameter schemas
export const CommonParams = {
  id: z.object({
    id: z.string().uuid('Invalid ID format')
  }),
  
  projectId: z.object({
    projectId: z.string().uuid('Invalid project ID format')
  }),
  
  assetId: z.object({
    assetId: z.string().uuid('Invalid asset ID format')
  }),
  
  jobId: z.object({
    jobId: z.string().uuid('Invalid job ID format')
  })
};

// Common query schemas
export const CommonQuery = {
  pagination: z.object({
    page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20)
  }).refine(data => data.page >= 1, { message: 'Page must be >= 1' })
   .refine(data => data.limit >= 1 && data.limit <= 100, { message: 'Limit must be between 1 and 100' })
};