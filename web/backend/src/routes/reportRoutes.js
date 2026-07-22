import express from 'express';
import { getUserReports, generateReport, downloadReport } from '../controllers/reportController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getUserReports);

router.post('/generate', generateReport);
router.get('/download/:filename', downloadReport);

export default router;
