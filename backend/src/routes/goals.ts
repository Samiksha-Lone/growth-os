import express from 'express';
import { GoalController } from '../controllers/goalController';
import auth from '../middleware/auth';

const router = express.Router();

// All goal routes require authentication
router.use(auth);

// POST /api/goals
router.post('/', GoalController.addGoal);

// GET /api/goals
router.get('/', GoalController.getGoals);

// DELETE /api/goals/:id
router.delete('/:id', GoalController.deleteGoal);

export default router;