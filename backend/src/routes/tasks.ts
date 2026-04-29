import express from 'express';
import { TaskController } from '../controllers/taskController';
import auth from '../middleware/auth';
import { cacheShort } from '../middleware/cache';

const router = express.Router();

// All task routes require authentication
router.use(auth);

// POST /api/tasks
router.post('/', TaskController.createTask);

// GET /api/tasks (cached 5 min)
router.get('/', cacheShort, TaskController.getTasks);

// PUT /api/tasks/:id
router.put('/:id', TaskController.updateTask);

// DELETE /api/tasks/:id
router.delete('/:id', TaskController.deleteTask);

export default router;