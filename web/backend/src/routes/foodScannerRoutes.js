import express from 'express';
import multer from 'multer';
import { scanFoodImage, getScanHistory } from '../controllers/foodScannerController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

router.use(protect);

router.post('/scan', upload.single('image'), scanFoodImage);
router.get('/history', getScanHistory);

export default router;
