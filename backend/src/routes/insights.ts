import express from 'express';
import { InsightsController } from '../controllers/insightsController';
import auth from '../middleware/auth';

const router = express.Router();

// All insights routes require authentication
router.use(auth);

// GET /api/insights/insights - Generate fresh insights
router.get('/insights', InsightsController.getInsights);

// GET /api/insights/history - Get insight history
router.get('/history', InsightsController.getInsightHistory);

// GET /api/insights/stats - Get insight statistics
router.get('/stats', InsightsController.getInsightStats);

// PUT /api/insights/:insightId/dismiss - Dismiss an insight
router.put('/:insightId/dismiss', InsightsController.dismissInsight);

export default router;
