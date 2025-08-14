import request from 'supertest';
import express from 'express';
import cors from 'cors';
import { errorHandler, requestLogger } from '../../middleware';

// Create a test app with the same middleware setup as the main app
const createTestApp = () => {
  const app = express();

  // Request logging middleware (only in development)
  if (process.env.NODE_ENV !== 'production') {
    app.use(requestLogger);
  }

  // CORS middleware
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
  }));

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Basic health check route
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'OK', 
      message: 'Asset Generation Tool API is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // API routes placeholder
  app.use('/api', (req, res) => {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'API endpoint not found',
        timestamp: new Date().toISOString()
      }
    });
  });

  // 404 handler for non-API routes
  app.use((req, res) => {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'Route not found',
        timestamp: new Date().toISOString()
      }
    });
  });

  // Error handling middleware (must be last)
  app.use(errorHandler);

  return app;
};

describe('Express Server Integration', () => {
  let app: express.Application;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toEqual({
        status: 'OK',
        message: 'Asset Generation Tool API is running',
        timestamp: expect.any(String),
        environment: expect.any(String)
      });
    });
  });

  describe('CORS Configuration', () => {
    it('should include CORS headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('JSON Body Parsing', () => {
    it('should parse JSON request bodies', async () => {
      // Create a new app with the test route added before the 404 handler
      const testApp = express();
      
      testApp.use(cors({
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true
      }));
      testApp.use(express.json({ limit: '10mb' }));
      testApp.use(express.urlencoded({ extended: true, limit: '10mb' }));
      
      // Add test route
      testApp.post('/test-json', (req, res) => {
        res.json({ received: req.body });
      });
      
      testApp.use(errorHandler);

      const testData = { test: 'data', number: 123 };

      const response = await request(testApp)
        .post('/test-json')
        .send(testData)
        .expect(200);

      expect(response.body.received).toEqual(testData);
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for API routes', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body).toEqual({
        error: {
          code: 'NOT_FOUND',
          message: 'API endpoint not found',
          timestamp: expect.any(String)
        }
      });
    });

    it('should handle 404 for non-API routes', async () => {
      const response = await request(app)
        .get('/nonexistent')
        .expect(404);

      expect(response.body).toEqual({
        error: {
          code: 'NOT_FOUND',
          message: 'Route not found',
          timestamp: expect.any(String)
        }
      });
    });

    it('should handle application errors', async () => {
      // Create a new app with the test route added before the 404 handler
      const testApp = express();
      
      testApp.use(cors({
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true
      }));
      testApp.use(express.json({ limit: '10mb' }));
      testApp.use(express.urlencoded({ extended: true, limit: '10mb' }));
      
      // Add test route that throws an error
      testApp.get('/test-error', (req, res, next) => {
        const error = new Error('Test error');
        next(error);
      });
      
      testApp.use(errorHandler);

      const response = await request(testApp)
        .get('/test-error')
        .expect(500);

      expect(response.body).toEqual({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          details: undefined,
          timestamp: expect.any(String)
        }
      });
    });
  });
});