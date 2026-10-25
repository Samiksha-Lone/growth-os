import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { Request, Response } from 'express';
import connectDB from './config/database';
import { initializeJobScheduler } from './jobs/taskScheduler';
import authRoutes from './routes/auth';
import taskRoutes from './routes/tasks';
import reflectionRoutes from './routes/reflections';
import habitRoutes from './routes/habits';
import goalRoutes from './routes/goals';
import analyticsRoutes from './routes/analytics';
import insightsRoutes from './routes/insights';
import realityCheckRoutes from './routes/realityCheck';
import dashboardRoutes from './routes/dashboard';
import historyRoutes from './routes/history';
import { errorHandler } from './middleware/errorHandler';
import { validateJwtSecret } from './config/environment';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// Disable all caching for API routes
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

// Enable compression for all responses
app.use(compression({
  level: 6, // Default compression level (0-9, higher = slower but better compression)
  threshold: 1024, // Only compress responses larger than 1KB
  filter: (req: Request, res: Response) => {
    // Don't compress responses with this request header
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Use compression filter function
    return compression.filter(req, res);
  }
}));

// CORS configuration
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : [
      'http://localhost:3000',
      'http://localhost:4173',
      'http://localhost:4174',
      'https://growth-os-chi.vercel.app'
    ];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/reflections', reflectionRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/reality-check', realityCheckRoutes);

// Error handling middleware
app.use(errorHandler);

const startServer = async (): Promise<void> => {
  try {
    validateJwtSecret();
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'JWT_SECRET configuration is invalid.');
    process.exit(1);
  }

  await connectDB();
  initializeJobScheduler();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

void startServer();