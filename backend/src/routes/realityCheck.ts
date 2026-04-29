import express from 'express';
import { RealityCheckController } from '../controllers/realityCheckController';
import auth from '../middleware/auth';
import { cacheShort } from '../middleware/cache';

const router = express.Router();

// All reality check routes require authentication
router.use(auth);

// GET /api/reality-check (cached 5 min)
router.get('/', cacheShort, RealityCheckController.getRealityCheck);

export default router;