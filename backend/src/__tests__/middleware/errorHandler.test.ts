import { Request, Response, NextFunction } from 'express';
import { ZodError, z } from 'zod';
import { errorHandler, AppError, asyncHandler } from '../../middleware/errorHandler';

// Mock Express objects
const mockRequest = {} as Request;
const mockResponse = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn()
} as unknown as Response;
const mockNext = jest.fn() as NextFunction;

describe('Error Handler Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('AppError handling', () => {
    it('should handle AppError correctly', () => {
      const error = new AppError('Test error', 400, 'TEST_ERROR', { field: 'value' });
      
      errorHandler(error, mockRequest, mockResponse, mockNext);
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'TEST_ERROR',
          message: 'Test error',
          details: { field: 'value' },
          timestamp: expect.any(String)
        }
      });
    });
  });

  describe('ZodError handling', () => {
    it('should handle ZodError correctly', () => {
      const schema = z.object({ name: z.string() });
      let zodError: ZodError;
      
      try {
        schema.parse({ name: 123 });
      } catch (error) {
        zodError = error as ZodError;
      }
      
      errorHandler(zodError!, mockRequest, mockResponse, mockNext);
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: {
            validationErrors: expect.arrayContaining([
              expect.objectContaining({
                path: 'name',
                message: expect.any(String),
                code: expect.any(String)
              })
            ])
          },
          timestamp: expect.any(String)
        }
      });
    });
  });

  describe('Generic error handling', () => {
    it('should handle generic errors', () => {
      const error = new Error('Generic error');
      
      errorHandler(error, mockRequest, mockResponse, mockNext);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          details: undefined,
          timestamp: expect.any(String)
        }
      });
      expect(console.error).toHaveBeenCalledWith('Unexpected error:', error);
    });
  });

  describe('asyncHandler', () => {
    it('should catch async errors and pass to next', async () => {
      const asyncFn = jest.fn().mockRejectedValue(new Error('Async error'));
      const wrappedFn = asyncHandler(asyncFn);
      
      await wrappedFn(mockRequest, mockResponse, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(new Error('Async error'));
    });

    it('should handle successful async functions', async () => {
      const asyncFn = jest.fn().mockResolvedValue('success');
      const wrappedFn = asyncHandler(asyncFn);
      
      await wrappedFn(mockRequest, mockResponse, mockNext);
      
      expect(asyncFn).toHaveBeenCalledWith(mockRequest, mockResponse, mockNext);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});