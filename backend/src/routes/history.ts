import express from 'express';
import { HistoryController } from '../controllers/historyController';
import auth from '../middleware/auth';
import { noCache } from '../middleware/cache';

const router = express.Router();

router.use(auth);
router.get('/', noCache, HistoryController.getHistory);

export default router;
