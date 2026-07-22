import express from 'express';
import { getChatHistory, sendMessageToChatbot, clearChatHistory } from '../controllers/chatbotController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getChatHistory)
  .post(sendMessageToChatbot)
  .delete(clearChatHistory);

export default router;
