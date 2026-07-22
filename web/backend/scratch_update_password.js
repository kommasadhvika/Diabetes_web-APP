import { db } from './src/config/db.js';
import bcrypt from 'bcryptjs';

async function resetPassword() {
  try {
    const email = 'kondasivaramajeswanth@gmail.com';
    const userSnap = await db.collection('Users').where('email', '==', email).get();
    if (userSnap.empty) {
      console.log('User not found. Creating user...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Password123!', salt);
      const userRef = db.collection('Users').doc();
      await userRef.set({
        id: userRef.id,
        name: 'Sivarama Jeswanth',
        email,
        phone: '1234567890',
        password: hashedPassword,
        isVerified: true,
        profileCompleted: true,
        createdAt: new Date().toISOString()
      });
      console.log('User created successfully with password: Password123!');
    } else {
      let docId;
      userSnap.forEach(doc => { docId = doc.id; });
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Password123!', salt);
      await db.collection('Users').doc(docId).update({
        password: hashedPassword,
        isVerified: true,
        profileCompleted: true
      });
      console.log('User password updated successfully to: Password123!');
    }
    process.exit(0);
  } catch (err) {
    console.error('Error resetting password:', err);
    process.exit(1);
  }
}

resetPassword();
