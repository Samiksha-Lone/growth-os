import express from 'express';
import { AnalyticsController } from '../controllers/analyticsController';
import auth from '../middleware/auth';

const router = express.Router();

// All analytics routes require authentication
router.use(auth);

// GET /api/analytics/daily-completion
router.get('/daily-completion', AnalyticsController.getDailyCompletionRate);

// GET /api/analytics/weekly
router.get('/weekly', AnalyticsController.getWeeklyStats);

// GET /api/analytics/monthly/:year/:month
router.get('/monthly/:year/:month', AnalyticsController.getMonthlyStats);

// GET /api/analytics/habit-consistency
router.get('/habit-consistency', AnalyticsController.getHabitConsistency);

// GET /api/analytics/mood-trends
router.get('/mood-trends', AnalyticsController.getMoodTrends);

export default router;