import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileManager } from './services/FileManager';
import { errorHandler, requestLogger } from './middleware';
import { apiRoutes } from './routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

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

// API routes
app.use('/api', apiRoutes);

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

// Initialize FileManager and start server
const startServer = async () => {
  try {
    await fileManager.initialize();
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
      console.log(`Data directory: ${fileManager.getDataDir()}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();