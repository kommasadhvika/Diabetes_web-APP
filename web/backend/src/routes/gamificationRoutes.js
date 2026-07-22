import express from 'express';
import { getGamificationStatus } from '../controllers/gamificationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/status', getGamificationStatus);

export default router;
