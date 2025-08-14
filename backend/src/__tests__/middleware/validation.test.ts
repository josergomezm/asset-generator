import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate, CommonParams, CommonQuery } from '../../middleware/validation';

// Mock Express objects
const mockNext = jest.fn() as NextFunction;

const createMockRequest = (body?: any, query?: any, params?: any): Request => ({
  body: body || {},
  query: query || {},
  params: params || {}
} as Request);

const mockResponse = {} as Response;

describe('Validation Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validate function', () => {
    it('should validate request body successfully', () => {
      const schema = z.object({ name: z.string() });
      const middleware = validate({ body: schema });
      const req = createMockRequest({ name: 'test' });
      
      middleware(req, mockResponse, mockNext);
      
      expect(req.body).toEqual({ name: 'test' });
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should validate query parameters successfully', () => {
      const schema = z.object({ page: z.string() });
      const middleware = validate({ query: schema });
      const req = createMockRequest(undefined, { page: '1' });
      
      middleware(req, mockResponse, mockNext);
      
      expect(req.query).toEqual({ page: '1' });
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should validate route parameters successfully', () => {
      const schema = z.object({ id: z.string().uuid() });
      const middleware = validate({ params: schema });
      const req = createMockRequest(undefined, undefined, { id: '123e4567-e89b-12d3-a456-426614174000' });
      
      middleware(req, mockResponse, mockNext);
      
      expect(req.params.id).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should pass validation errors to next', () => {
      const schema = z.object({ name: z.string() });
      const middleware = validate({ body: schema });
      const req = createMockRequest({ name: 123 });
      
      middleware(req, mockResponse, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(expect.any(z.ZodError));
    });
  });

  describe('CommonParams', () => {
    it('should validate UUID parameters', () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      const result = CommonParams.id.parse({ id: validUuid });
      expect(result.id).toBe(validUuid);
    });

    it('should reject invalid UUID parameters', () => {
      expect(() => {
        CommonParams.id.parse({ id: 'invalid-uuid' });
      }).toThrow();
    });
  });

  describe('CommonQuery', () => {
    it('should parse pagination parameters correctly', () => {
      const result = CommonQuery.pagination.parse({ page: '2', limit: '10' });
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
    });

    it('should use default values for missing pagination parameters', () => {
      const result = CommonQuery.pagination.parse({});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should reject invalid pagination values', () => {
      expect(() => {
        CommonQuery.pagination.parse({ page: '0' });
      }).toThrow();

      expect(() => {
        CommonQuery.pagination.parse({ limit: '101' });
      }).toThrow();
    });
  });
});