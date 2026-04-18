import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import connectDB from './config/database';
import authRoutes from './routes/auth';
import taskRoutes from './routes/tasks';
import reflectionRoutes from './routes/reflections';
import habitRoutes from './routes/habits';
import goalRoutes from './routes/goals';
import analyticsRoutes from './routes/analytics';
import aiRoutes from './routes/ai';
import realityCheckRoutes from './routes/realityCheck';
import pomodoroRoutes from './routes/pomodoro';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(cors());
app.use(express.json());

// Serve static files from the uploads directory with explicit CORS headers
const uploadsDir = path.join(process.cwd(), 'uploads');
const avatarsDir = path.join(uploadsDir, 'avatars');
if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
}, express.static(uploadsDir));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/reflections', reflectionRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/reality-check', realityCheckRoutes);
app.use('/api/pomodoro', pomodoroRoutes);

// Error handling middleware
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});