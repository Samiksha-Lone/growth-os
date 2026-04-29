import express from 'express';
import { GoalController } from '../controllers/goalController';
import auth from '../middleware/auth';
import { cacheMedium } from '../middleware/cache';

const router = express.Router();

// All goal routes require authentication
router.use(auth);

// POST /api/goals
router.post('/', GoalController.addGoal);

// GET /api/goals (cached 15 min)
router.get('/', cacheMedium, GoalController.getGoals);

// DELETE /api/goals/:id
router.delete('/:id', GoalController.deleteGoal);

export default router;