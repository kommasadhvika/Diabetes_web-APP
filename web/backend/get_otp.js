import { db } from './src/config/db.js';

async function getOTP() {
  try {
    const usersSnap = await db.collection('Users').get();
    const users = [];
    usersSnap.forEach(doc => users.push(doc.data()));
    users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (users.length > 0) {
      const latest = users[0];
      console.log('--- LATEST REGISTERED USER OTP ---');
      console.log('Email:', latest.email);
      console.log('OTP Code:', latest.otp);
      console.log('isVerified:', latest.isVerified);
      console.log('----------------------------------');
    } else {
      console.log('No users found in database.');
    }
    process.exit(0);
  } catch (err) {
    console.error('Error fetching OTP:', err.message);
    process.exit(1);
  }
}

getOTP();
