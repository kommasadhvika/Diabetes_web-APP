import { db } from '../config/db.js';

// @desc    Get current user profile
// @route   GET /api/profile
export const getProfile = async (req, res) => {
  const userId = req.user.id;

  try {
    const profileDoc = await db.collection('Profiles').doc(userId).get();
    if (!profileDoc.exists) {
      return res.status(404).json({ success: false, message: 'Profile not found. Please complete your profile.' });
    }

    res.status(200).json({ success: true, profile: profileDoc.data() });
  } catch (error) {
    console.error('Get profile error:', error.message);
    res.status(500).json({ success: false, message: 'Server error retrieving profile' });
  }
};

// @desc    Create or update user profile
// @route   POST /api/profile
export const updateProfile = async (req, res) => {
  const userId = req.user.id;
  const { fullName, age, gender, height, weight, diabetesType, activityLevel, medicalNotes } = req.body;

  try {
    const profileRef = db.collection('Profiles').doc(userId);
    
    const profileData = {
      userId,
      fullName,
      age: parseInt(age),
      gender,
      height: parseFloat(height),
      weight: parseFloat(weight),
      diabetesType, // e.g. "Type 1", "Type 2", "Gestational", "Prediabetes"
      activityLevel, // e.g. "Sedentary", "Lightly Active", "Moderately Active", "Very Active"
      medicalNotes: medicalNotes || '',
      updatedAt: new Date().toISOString()
    };

    await profileRef.set(profileData, { merge: true });

    // Update profileCompleted status on User record
    await db.collection('Users').doc(userId).update({
      profileCompleted: true
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      profile: profileData
    });
  } catch (error) {
    console.error('Update profile error:', error.message);
    res.status(500).json({ success: false, message: 'Server error updating profile' });
  }
};
