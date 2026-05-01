import express from 'express';
import { DashboardController } from '../controllers/dashboardController';
import auth from '../middleware/auth';
import { cacheShort } from '../middleware/cache';

const router = express.Router();

// All dashboard routes require authentication
router.use(auth);

// GET /api/dashboard/stats (cached 5 min) - Single endpoint for all dashboard data
router.get('/stats', cacheShort, DashboardController.getDashboardStats);

export default router;
