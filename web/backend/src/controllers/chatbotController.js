import { db } from '../config/db.js';
import { getChatbotResponse } from '../services/ai/chatbotAI.js';
import { emitToUser } from '../config/socket.js';

// @desc    Get chat history
// @route   GET /api/chatbot
export const getChatHistory = async (req, res) => {
  const userId = req.user.id;

  try {
    const chatSnap = await db.collection('chatHistory')
      .where('userId', '==', userId)
      .get();

    const messages = [];
    chatSnap.forEach(doc => {
      messages.push(doc.data());
    });

    // Sort ascending so the chat is chronological
    messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    res.status(200).json({
      success: true,
      count: messages.length,
      messages
    });
  } catch (error) {
    console.error('Get chat history error:', error.message);
    res.status(500).json({ success: false, message: 'Server error retrieving chat history' });
  }
};

// @desc    Send a message to AI Chatbot
// @route   POST /api/chatbot
export const sendMessageToChatbot = async (req, res) => {
  const userId = req.user.id;
  const { message } = req.body;

  if (!message || message.trim() === '') {
    return res.status(400).json({ success: false, message: 'Message is required' });
  }

  try {
    // 1. Get user profile
    const profileDoc = await db.collection('Profiles').doc(userId).get();
    const profile = profileDoc.exists ? profileDoc.data() : null;

    // 2. Get recent sugar readings
    const readingsSnap = await db.collection('SugarReadings')
      .where('userId', '==', userId)
      .get();
    
    const sugarLogs = [];
    readingsSnap.forEach(doc => {
      sugarLogs.push(doc.data());
    });
    sugarLogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // 3. Get existing chat history
    const chatSnap = await db.collection('chatHistory')
      .where('userId', '==', userId)
      .get();
    
    const historyList = [];
    chatSnap.forEach(doc => {
      historyList.push(doc.data());
    });
    historyList.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    // Save User message
    const userMsgRef = db.collection('chatHistory').doc();
    const userMessage = {
      id: userMsgRef.id,
      userId,
      sender: 'user',
      message: message.trim(),
      createdAt: new Date().toISOString()
    };
    await userMsgRef.set(userMessage);

    // Emit socket event for the user message
    emitToUser(userId, 'chatMessageSent', userMessage);

    // 4. Generate AI reply
    const chatbotReply = await getChatbotResponse(message.trim(), historyList, profile, sugarLogs);

    // Save Assistant reply
    const assistantMsgRef = db.collection('chatHistory').doc();
    const assistantMessage = {
      id: assistantMsgRef.id,
      userId,
      sender: 'assistant',
      message: chatbotReply,
      createdAt: new Date().toISOString()
    };
    await assistantMsgRef.set(assistantMessage);

    // Gamification hook: award 5 XP for chatbot interaction (once per day or per interaction up to a limit)
    // We can reward 5 XP for using the health assistant
    import('../utils/gamification.js').then(async ({ awardXp }) => {
      await awardXp(userId, 10, 'Health AI consultation');
    }).catch(err => console.error('Gamification chatbot error:', err));

    // Emit socket event for the assistant response
    emitToUser(userId, 'chatMessageReceived', assistantMessage);

    res.status(200).json({
      success: true,
      userMessage,
      assistantMessage
    });
  } catch (error) {
    console.error('Send message to chatbot error:', error.message);
    res.status(500).json({ success: false, message: 'Server error processing chatbot message' });
  }
};

// @desc    Clear chat history
// @route   DELETE /api/chatbot
export const clearChatHistory = async (req, res) => {
  const userId = req.user.id;

  try {
    const chatSnap = await db.collection('chatHistory')
      .where('userId', '==', userId)
      .get();

    const batch = db.batch();
    chatSnap.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    res.status(200).json({
      success: true,
      message: 'Chat history cleared successfully!'
    });
  } catch (error) {
    console.error('Clear chat history error:', error.message);
    res.status(500).json({ success: false, message: 'Server error clearing chat history' });
  }
};
