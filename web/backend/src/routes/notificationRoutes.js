import express from 'express';
import { getNotifications, markAsRead, clearAllNotifications, subscribeWebPush } from '../controllers/notificationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getNotifications)
  .delete(clearAllNotifications);

router.put('/:id/read', markAsRead);
router.post('/subscribe', subscribeWebPush);

export default router;
