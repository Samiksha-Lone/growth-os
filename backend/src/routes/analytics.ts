import express from 'express';
import { AnalyticsController } from '../controllers/analyticsController';
import auth from '../middleware/auth';
import { cacheShort, cacheMedium } from '../middleware/cache';

const router = express.Router();

// All analytics routes require authentication
router.use(auth);

// GET /api/analytics/daily-completion (cached 5 min)
router.get('/daily-completion', cacheShort, AnalyticsController.getDailyCompletionRate);

// GET /api/analytics/weekly-trend (cached 15 min)
router.get('/weekly-trend', cacheMedium, AnalyticsController.getWeeklyTrend);
 
// GET /api/analytics/weekly (cached 15 min)
router.get('/weekly', cacheMedium, AnalyticsController.getWeeklyStats);

// GET /api/analytics/monthly/:year/:month (cached 15 min)
router.get('/monthly/:year/:month', cacheMedium, AnalyticsController.getMonthlyStats);

// GET /api/analytics/habit-consistency
router.get('/habit-consistency', AnalyticsController.getHabitConsistency);

// GET /api/analytics/mood-trends
router.get('/mood-trends', AnalyticsController.getMoodTrends);

export default router;