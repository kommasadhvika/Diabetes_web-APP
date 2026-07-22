import express from 'express';
import { getDietPlan, forceGenerateDietPlan, toggleGroceryItem } from '../controllers/dietController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getDietPlan);
router.post('/generate', forceGenerateDietPlan);
router.put('/grocery', toggleGroceryItem);

export default router;
