import { db } from './src/config/db.js';

async function checkProfile() {
  try {
    const email = 'kondasivaramajeswanth@gmail.com';
    const userSnap = await db.collection('Users').where('email', '==', email).get();
    if (userSnap.empty) {
      console.log('User not found.');
      process.exit(1);
    }
    let userDoc;
    userSnap.forEach(doc => { userDoc = doc.data(); });
    const userId = userDoc.id;
    console.log('User ID:', userId);

    const profileDoc = await db.collection('Profiles').doc(userId).get();
    if (!profileDoc.exists) {
      console.log('Profile not found. Seeding profile...');
      await db.collection('Profiles').doc(userId).set({
        userId,
        fullName: 'Sivarama Jeswanth',
        age: 35,
        gender: 'Male',
        height: 175,
        weight: 80,
        diabetesType: 'Type 2',
        activityLevel: 'Moderately Active',
        medicalNotes: 'Diagnosed with Type 2 diabetes 2 years ago. Prefers low-carb diet.',
        updatedAt: new Date().toISOString()
      });
      await db.collection('Users').doc(userId).update({
        profileCompleted: true
      });
      console.log('Profile seeded successfully.');
    } else {
      console.log('Profile exists:', profileDoc.data());
    }
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkProfile();
