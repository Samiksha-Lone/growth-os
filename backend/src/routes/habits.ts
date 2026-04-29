import express from 'express';
import { HabitController } from '../controllers/habitController';
import auth from '../middleware/auth';
import { cacheShort } from '../middleware/cache';

const router = express.Router();

// All habit routes require authentication
router.use(auth);

// POST /api/habits
router.post('/', HabitController.createHabit);

// GET /api/habits (cached 5 min)
router.get('/', cacheShort, HabitController.getHabits);

// POST /api/habits/:id/complete
router.post('/:id/complete', HabitController.markHabitComplete);

// GET /api/habits/:id/stats
router.get('/:id/stats', HabitController.getHabitStats);

// DELETE /api/habits/:id
router.delete('/:id', HabitController.deleteHabit);

export default router;