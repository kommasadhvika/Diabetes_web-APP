import { db } from '../config/db.js';

// Default Scheduler events
const getDefaultSchedule = (userId) => {
  return {
    userId,
    events: [
      { id: '1', title: 'Morning Exercise', time: '07:00 AM', type: 'exercise', status: 'pending' },
      { id: '2', title: 'Fasting Sugar Check', time: '07:45 AM', type: 'check', status: 'pending' },
      { id: '3', title: 'Healthy Breakfast', time: '08:15 AM', type: 'meal', status: 'pending' },
      { id: '4', title: 'Mid-Morning Water Intake', time: '11:00 AM', type: 'water', status: 'pending' },
      { id: '5', title: 'Balanced Lunch', time: '01:30 PM', type: 'meal', status: 'pending' },
      { id: '6', title: 'Evening Snack & Tea', time: '05:00 PM', type: 'meal', status: 'pending' },
      { id: '7', title: 'Post-Dinner Walk', time: '08:30 PM', type: 'exercise', status: 'pending' },
      { id: '8', title: 'Bedtime Water', time: '09:45 PM', type: 'water', status: 'pending' }
    ],
    updatedAt: new Date().toISOString()
  };
};

// @desc    Get current daily scheduler list
// @route   GET /api/schedule
export const getSchedule = async (req, res) => {
  const userId = req.user.id;

  try {
    const docRef = db.collection('Scheduler').doc(userId);
    const doc = await docRef.get();

    if (doc.exists) {
      return res.status(200).json({ success: true, schedule: doc.data() });
    }

    // Auto-create default schedule
    const defaultData = getDefaultSchedule(userId);
    await docRef.set(defaultData);

    res.status(200).json({ success: true, schedule: defaultData });
  } catch (error) {
    console.error('Get schedule error:', error.message);
    res.status(500).json({ success: false, message: 'Server error retrieving scheduler' });
  }
};

// @desc    Update/Save scheduler details
// @route   PUT /api/schedule
export const updateSchedule = async (req, res) => {
  const userId = req.user.id;
  const { events } = req.body;

  if (!events || !Array.isArray(events)) {
    return res.status(400).json({ success: false, message: 'Invalid events array provided' });
  }

  try {
    const docRef = db.collection('Scheduler').doc(userId);
    const updatedData = {
      userId,
      events,
      updatedAt: new Date().toISOString()
    };

    await docRef.set(updatedData, { merge: true });

    res.status(200).json({
      success: true,
      message: 'Schedule updated successfully!',
      schedule: updatedData
    });
  } catch (error) {
    console.error('Update schedule error:', error.message);
    res.status(500).json({ success: false, message: 'Server error saving scheduler updates' });
  }
};

// @desc    Toggle scheduler event completion status
// @route   PUT /api/schedule/toggle/:eventId
export const toggleEventStatus = async (req, res) => {
  const userId = req.user.id;
  const eventId = req.params.eventId;

  try {
    const docRef = db.collection('Scheduler').doc(userId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Schedule not initialized.' });
    }

    const scheduleData = doc.data();
    const updatedEvents = scheduleData.events.map(event => {
      if (event.id === eventId) {
        return { ...event, status: event.status === 'completed' ? 'pending' : 'completed' };
      }
      return event;
    });

    await docRef.update({
      events: updatedEvents,
      updatedAt: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      message: 'Event state changed!',
      events: updatedEvents
    });
  } catch (error) {
    console.error('Toggle event status error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
