import { db } from '../config/db.js';

// @desc    Get user notifications
// @route   GET /api/notifications
export const getNotifications = async (req, res) => {
  const userId = req.user.id;

  try {
    const snap = await db.collection('Notifications').where('userId', '==', userId).get();
    const notifications = [];

    snap.forEach(doc => {
      notifications.push(doc.data());
    });

    // Sort descending by date
    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({
      success: true,
      count: notifications.length,
      notifications
    });
  } catch (error) {
    console.error('Get notifications error:', error.message);
    res.status(500).json({ success: false, message: 'Server error retrieving notifications' });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
export const markAsRead = async (req, res) => {
  const userId = req.user.id;
  const notifId = req.params.id;

  try {
    const ref = db.collection('Notifications').doc(notifId);
    const snap = await ref.get();

    if (!snap.exists) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    if (snap.data().userId !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await ref.update({ read: true });

    res.status(200).json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark read error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Clear all notifications
// @route   DELETE /api/notifications
export const clearAllNotifications = async (req, res) => {
  const userId = req.user.id;

  try {
    const snap = await db.collection('Notifications').where('userId', '==', userId).get();
    
    for (const doc of snap.docs) {
      await db.collection('Notifications').doc(doc.id).delete();
    }

    res.status(200).json({ success: true, message: 'All notifications cleared successfully' });
  } catch (error) {
    console.error('Clear notifications error:', error.message);
    res.status(500).json({ success: false, message: 'Server error clearing notifications' });
  }
};

// @desc    Register Web Push Notification Subscription Token
// @route   POST /api/notifications/subscribe
export const subscribeWebPush = async (req, res) => {
  const userId = req.user.id;
  const { subscription } = req.body;

  if (!subscription) {
    return res.status(400).json({ success: false, message: 'Subscription payload is required' });
  }

  try {
    // Store Web Push registration subscription details under User Settings/Subscriptions
    await db.collection('Subscriptions').doc(userId).set({
      userId,
      subscription,
      updatedAt: new Date().toISOString()
    });

    res.status(201).json({ success: true, message: 'Web Push subscription registered successfully!' });
  } catch (error) {
    console.error('Register subscription error:', error.message);
    res.status(500).json({ success: false, message: 'Server error registering push service' });
  }
};
