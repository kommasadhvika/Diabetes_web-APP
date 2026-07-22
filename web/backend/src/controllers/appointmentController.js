import { db } from '../config/db.js';

// @desc    Get user appointments
// @route   GET /api/appointments
export const getAppointments = async (req, res) => {
  const userId = req.user.id;

  try {
    const snap = await db.collection('Appointments').where('userId', '==', userId).get();
    const appointments = [];
    
    snap.forEach(doc => {
      appointments.push(doc.data());
    });

    // Sort by date/time ascending
    appointments.sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));

    res.status(200).json({
      success: true,
      count: appointments.length,
      appointments
    });
  } catch (error) {
    console.error('Get appointments error:', error.message);
    res.status(500).json({ success: false, message: 'Server error retrieving appointments' });
  }
};

// @desc    Create new doctor appointment
// @route   POST /api/appointments
export const createAppointment = async (req, res) => {
  const userId = req.user.id;
  const { doctorName, hospitalName, date, time, notes } = req.body;

  try {
    const appointRef = db.collection('Appointments').doc();
    
    const newAppointment = {
      id: appointRef.id,
      userId,
      doctorName,
      hospitalName,
      date, // YYYY-MM-DD
      time, // HH:MM
      notes: notes || '',
      completed: false,
      createdAt: new Date().toISOString()
    };

    await appointRef.set(newAppointment);

    // Create system notification
    const notifRef = db.collection('Notifications').doc();
    await notifRef.set({
      id: notifRef.id,
      userId,
      title: 'Appointment Scheduled',
      message: `You have scheduled a checkup with Dr. ${doctorName} on ${date} at ${time}.`,
      type: 'appointment',
      read: false,
      createdAt: new Date().toISOString()
    });

    res.status(201).json({
      success: true,
      message: 'Doctor appointment scheduled!',
      appointment: newAppointment
    });
  } catch (error) {
    console.error('Create appointment error:', error.message);
    res.status(500).json({ success: false, message: 'Server error saving appointment' });
  }
};

// @desc    Update appointment
// @route   PUT /api/appointments/:id
export const updateAppointment = async (req, res) => {
  const userId = req.user.id;
  const appointId = req.params.id;
  const { doctorName, hospitalName, date, time, notes, completed } = req.body;

  try {
    const docRef = db.collection('Appointments').doc(appointId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    const data = docSnap.data();
    if (data.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this appointment' });
    }

    const updatedData = {
      doctorName: doctorName || data.doctorName,
      hospitalName: hospitalName || data.hospitalName,
      date: date || data.date,
      time: time || data.time,
      notes: notes !== undefined ? notes : data.notes,
      completed: completed !== undefined ? !!completed : data.completed,
      updatedAt: new Date().toISOString()
    };

    await docRef.update(updatedData);

    res.status(200).json({
      success: true,
      message: 'Appointment updated successfully!',
      appointment: { ...data, ...updatedData }
    });
  } catch (error) {
    console.error('Update appointment error:', error.message);
    res.status(500).json({ success: false, message: 'Server error updating appointment' });
  }
};

// @desc    Delete appointment
// @route   DELETE /api/appointments/:id
export const deleteAppointment = async (req, res) => {
  const userId = req.user.id;
  const appointId = req.params.id;

  try {
    const docRef = db.collection('Appointments').doc(appointId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (docSnap.data().userId !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await docRef.delete();

    res.status(200).json({ success: true, message: 'Appointment cancelled/deleted successfully' });
  } catch (error) {
    console.error('Delete appointment error:', error.message);
    res.status(500).json({ success: false, message: 'Server error deleting appointment' });
  }
};
