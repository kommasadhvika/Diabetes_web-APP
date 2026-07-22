import express from 'express';
import { getExercisesCatalog, logExerciseActivity, getExerciseLogs, getExerciseSchedule, forceGenerateExerciseSchedule } from '../controllers/exerciseController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getExercisesCatalog);
router.route('/log')
  .get(getExerciseLogs)
  .post(logExerciseActivity);

router.get('/schedule', getExerciseSchedule);
router.post('/schedule/generate', forceGenerateExerciseSchedule);

export default router;
