import express from 'express';
import { addSugarReading, getSugarHistory, deleteSugarReading, getAiReport } from '../controllers/sugarController.js';
import { protect } from '../middleware/auth.js';
import { validateSugar } from '../middleware/validator.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getSugarHistory)
  .post(validateSugar, addSugarReading);

router.delete('/:id', deleteSugarReading);
router.get('/report', getAiReport);

export default router;
