import express from 'express';
import { ReflectionController } from '../controllers/reflectionController';
import auth from '../middleware/auth';

const router = express.Router();

// All reflection routes require authentication
router.use(auth);

// POST /api/reflections
router.post('/', ReflectionController.createReflection);

// GET /api/reflections
router.get('/', ReflectionController.getReflections);

// GET /api/reflections/:date
router.get('/:date', ReflectionController.getReflectionByDate);

// PUT /api/reflections/:id
router.put('/:id', ReflectionController.updateReflection);

export default router;