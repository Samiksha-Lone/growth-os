import express from 'express';
import { AIInsightsController } from '../controllers/aiInsightsController';
import auth from '../middleware/auth';

const router = express.Router();

// All AI routes require authentication
router.use(auth);

// GET /api/ai/insights
router.get('/insights', AIInsightsController.getInsights);

export default router;