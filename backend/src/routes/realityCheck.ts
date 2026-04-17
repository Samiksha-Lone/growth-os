import express from 'express';
import { RealityCheckController } from '../controllers/realityCheckController';
import auth from '../middleware/auth';

const router = express.Router();

// All reality check routes require authentication
router.use(auth);

// GET /api/reality-check
router.get('/', RealityCheckController.getRealityCheck);

export default router;