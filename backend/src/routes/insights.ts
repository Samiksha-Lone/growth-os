import express from 'express';
import { InsightsController } from '../controllers/insightsController';
import auth from '../middleware/auth';
import { cacheMedium } from '../middleware/cache';

const router = express.Router();

// All insights routes require authentication
router.use(auth);

// GET /api/insights/insights - Generate fresh insights (cached 15 min)
router.get('/insights', cacheMedium, InsightsController.getInsights);

// GET /api/insights/history - Get insight history (cached 15 min)
router.get('/history', cacheMedium, InsightsController.getInsightHistory);

// GET /api/insights/stats - Get insight statistics (cached 15 min)
router.get('/stats', cacheMedium, InsightsController.getInsightStats);

// PUT /api/insights/:insightId/dismiss - Dismiss an insight
router.put('/:insightId/dismiss', InsightsController.dismissInsight);

export default router;
