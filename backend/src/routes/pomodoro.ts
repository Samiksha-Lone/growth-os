import express from 'express';
import { PomodoroController } from '../controllers/pomodoroController';
import auth from '../middleware/auth';

const router = express.Router();

// All pomodoro routes require authentication
router.use(auth);

// POST /api/pomodoro/sessions
router.post('/sessions', PomodoroController.createSession);

// GET /api/pomodoro/sessions
router.get('/sessions', PomodoroController.getSessions);

// GET /api/pomodoro/total-focus-time
router.get('/total-focus-time', PomodoroController.getTotalFocusTime);

export default router;