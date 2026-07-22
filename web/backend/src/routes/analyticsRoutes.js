import express from 'express';
import { getAnalyticsDashboard } from '../controllers/analyticsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getAnalyticsDashboard);

export default router;
