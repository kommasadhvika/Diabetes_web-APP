import express from 'express';
import { getSchedule, updateSchedule, toggleEventStatus } from '../controllers/scheduleController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getSchedule)
  .put(updateSchedule);

router.put('/toggle/:eventId', toggleEventStatus);

export default router;
