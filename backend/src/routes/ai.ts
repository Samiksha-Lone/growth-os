import express from 'express';
import { AIInsightsController } from '../controllers/aiInsightsController';
import auth from '../middleware/auth';

const router = express.Router();

// All AI routes require authentication
router.use(auth);

// GET /api/ai/insights - Generate fresh insights
router.get('/insights', AIInsightsController.getInsights);

// GET /api/ai/insights/history - Get insight history
router.get('/insights/history', AIInsightsController.getInsightHistory);

// GET /api/ai/insights/stats - Get insight statistics
router.get('/insights/stats', AIInsightsController.getInsightStats);

// PUT /api/ai/insights/:insightId/dismiss - Dismiss an insight
router.put('/insights/:insightId/dismiss', AIInsightsController.dismissInsight);

export default router;