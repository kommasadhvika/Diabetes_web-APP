import express from 'express';
import { getWaterStatus, addWaterIntake, updateWaterSettings } from '../controllers/waterController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getWaterStatus)
  .post(addWaterIntake);

router.put('/settings', updateWaterSettings);

export default router;
