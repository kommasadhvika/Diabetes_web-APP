import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/db.js';
import { sendEmail } from '../services/emailService.js';

// Helper: Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Helper: Generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET || 'super_secret_diabetes_management_key_12345',
    { expiresIn: '30d' }
  );
};

// @desc    Register new user & send OTP
// @route   POST /api/auth/signup
export const signup = async (req, res) => {
  const { name, email, password, phone } = req.body;

  try {
    // Check if user already exists
    const userSnap = await db.collection('Users').where('email', '==', email).get();
    if (!userSnap.empty) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 mins expiry

    // Save user in DB
    const userRef = db.collection('Users').doc();
    const newUser = {
      id: userRef.id,
      name,
      email,
      phone,
      password: hashedPassword,
      isVerified: false,
      otp,
      otpExpires,
      profileCompleted: false,
      createdAt: new Date().toISOString()
    };

    await userRef.set(newUser);

    // Send email with OTP
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #0d9488; text-align: center;">Verify Your Account</h2>
        <p>Dear ${name},</p>
        <p>Thank you for registering on AI Diabetes Management System. Please use the following One-Time Password (OTP) to verify your account. This OTP is valid for 10 minutes:</p>
        <div style="font-size: 24px; font-weight: bold; text-align: center; margin: 30px 0; letter-spacing: 5px; color: #0d9488;">${otp}</div>
        <p>If you did not initiate this request, please ignore this email.</p>
        <p>Best regards,<br/>The AI Diabetes Team</p>
      </div>
    `;

    console.log('\n--- OTP Signup Flow Diagnostics ---');
    console.log(`User Entered Email: ${email}`);
    console.log(`Generated OTP: ${otp}`);
    console.log(`Recipient Email: ${email}`);
    console.log('-----------------------------------\n');

    try {
      const emailResult = await sendEmail({
        to: email,
        subject: 'AI Diabetes Account Verification OTP',
        html: emailHtml,
        text: `Your account verification OTP is ${otp}. Valid for 10 minutes.`
      });
      if (emailResult && emailResult.message && emailResult.message.includes('failed')) {
        console.log(`[DEVELOPMENT ALERT] Email delivery bypassed/failed. OTP Code for ${email}: ${otp}`);
      }
    } catch (emailError) {
      console.error('Email delivery error. Fallback OTP display:');
      console.log(`[DEVELOPMENT ALERT] OTP Code for ${email}: ${otp}`);
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful! Verification OTP sent to your email.',
      userId: userRef.id,
      email: email
    });
  } catch (error) {
    console.error('Signup error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during signup' });
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
export const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Please provide email and OTP' });
  }

  try {
    const userSnap = await db.collection('Users').where('email', '==', email).get();
    if (userSnap.empty) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let userDoc;
    userSnap.forEach(doc => { userDoc = doc.data(); });

    // Validate OTP
    if (userDoc.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP code' });
    }

    // Check expiry
    if (new Date(userDoc.otpExpires) < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    // Mark user as verified
    await db.collection('Users').doc(userDoc.id).update({
      isVerified: true,
      otp: null,
      otpExpires: null
    });

    const token = generateToken(userDoc);

    res.status(200).json({
      success: true,
      message: 'Account verified successfully!',
      token,
      user: {
        id: userDoc.id,
        name: userDoc.name,
        email: userDoc.email,
        phone: userDoc.phone,
        profileCompleted: userDoc.profileCompleted
      }
    });
  } catch (error) {
    console.error('OTP Verification error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during verification' });
  }
};

// @desc    Resend Verification OTP
// @route   POST /api/auth/resend-otp
export const resendOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Please provide email' });
  }

  try {
    const userSnap = await db.collection('Users').where('email', '==', email).get();
    if (userSnap.empty) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let userDoc;
    userSnap.forEach(doc => { userDoc = doc.data(); });

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await db.collection('Users').doc(userDoc.id).update({
      otp,
      otpExpires
    });

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #0d9488; text-align: center;">Verify Your Account</h2>
        <p>Dear ${userDoc.name},</p>
        <p>You requested a new verification code. Please use the following One-Time Password (OTP) to verify your account (valid for 10 minutes):</p>
        <div style="font-size: 24px; font-weight: bold; text-align: center; margin: 30px 0; letter-spacing: 5px; color: #0d9488;">${otp}</div>
        <p>Best regards,<br/>The AI Diabetes Team</p>
      </div>
    `;

    console.log('\n--- OTP Resend Flow Diagnostics ---');
    console.log(`User Entered Email: ${email}`);
    console.log(`Generated OTP: ${otp}`);
    console.log(`Recipient Email: ${email}`);
    console.log('-----------------------------------\n');

    try {
      const emailResult = await sendEmail({
        to: email,
        subject: 'New Verification OTP',
        html: emailHtml,
        text: `Your new OTP is ${otp}.`
      });
      if (emailResult && emailResult.message && emailResult.message.includes('failed')) {
        console.log(`[DEVELOPMENT ALERT] Email delivery bypassed/failed. OTP Code for ${email}: ${otp}`);
      }
    } catch (emailError) {
      console.error('Email delivery error. Fallback OTP display:');
      console.log(`[DEVELOPMENT ALERT] OTP Code for ${email}: ${otp}`);
    }

    res.status(200).json({ success: true, message: 'New verification OTP sent to your email.' });
  } catch (error) {
    console.error('Resend OTP error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    User login
// @route   POST /api/auth/login
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const userSnap = await db.collection('Users').where('email', '==', email).get();
    if (userSnap.empty) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    let userDoc;
    userSnap.forEach(doc => { userDoc = doc.data(); });

    // Validate password
    const isMatch = await bcrypt.compare(password, userDoc.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    // Check email verification status
    if (!userDoc.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Your account is not verified. Please verify your email first.',
        isVerified: false,
        email: userDoc.email
      });
    }

    const token = generateToken(userDoc);

    res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: userDoc.id,
        name: userDoc.name,
        email: userDoc.email,
        phone: userDoc.phone,
        profileCompleted: userDoc.profileCompleted
      }
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

// @desc    Forgot Password - Send Reset Code
// @route   POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Please provide email' });
  }

  try {
    const userSnap = await db.collection('Users').where('email', '==', email).get();
    if (userSnap.empty) {
      return res.status(404).json({ success: false, message: 'No account with that email exists' });
    }

    let userDoc;
    userSnap.forEach(doc => { userDoc = doc.data(); });

    const resetOtp = generateOTP();
    const resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await db.collection('Users').doc(userDoc.id).update({
      resetOtp,
      resetOtpExpires
    });

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #4f46e5; text-align: center;">Reset Your Password</h2>
        <p>Dear ${userDoc.name},</p>
        <p>You requested a password reset. Please use the following 6-digit OTP code to verify and reset your password. This code is valid for 10 minutes:</p>
        <div style="font-size: 24px; font-weight: bold; text-align: center; margin: 30px 0; letter-spacing: 5px; color: #4f46e5;">${resetOtp}</div>
        <p>If you did not request this, please secure your account immediately.</p>
        <p>Best regards,<br/>The AI Diabetes Team</p>
      </div>
    `;

    console.log('\n--- Password Reset Flow Diagnostics ---');
    console.log(`User Entered Email: ${email}`);
    console.log(`Generated OTP: ${resetOtp}`);
    console.log(`Recipient Email: ${email}`);
    console.log('-----------------------------------\n');

    try {
      const emailResult = await sendEmail({
        to: email,
        subject: 'Password Reset OTP Verification',
        html: emailHtml,
        text: `Your password reset OTP is ${resetOtp}.`
      });
      if (emailResult && emailResult.message && emailResult.message.includes('failed')) {
        console.log(`[DEVELOPMENT ALERT] Email delivery bypassed/failed. OTP Code for ${email}: ${resetOtp}`);
      }
    } catch (emailError) {
      console.error('Email delivery error. Fallback OTP display:');
      console.log(`[DEVELOPMENT ALERT] OTP Code for ${email}: ${resetOtp}`);
    }

    res.status(200).json({ success: true, message: 'Password reset OTP has been sent to your email.' });
  } catch (error) {
    console.error('Forgot password error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Reset Password with OTP
// @route   POST /api/auth/reset-password
export const resetPassword = async (req, res) => {
  const { email, resetOtp, newPassword } = req.body;

  if (!email || !resetOtp || !newPassword) {
    return res.status(400).json({ success: false, message: 'Please provide email, reset OTP, and new password' });
  }

  try {
    const userSnap = await db.collection('Users').where('email', '==', email).get();
    if (userSnap.empty) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let userDoc;
    userSnap.forEach(doc => { userDoc = doc.data(); });

    // Validate Reset OTP
    if (userDoc.resetOtp !== resetOtp) {
      return res.status(400).json({ success: false, message: 'Invalid reset code' });
    }

    if (new Date(userDoc.resetOtpExpires) < new Date()) {
      return res.status(400).json({ success: false, message: 'Reset code expired' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Save new password
    await db.collection('Users').doc(userDoc.id).update({
      password: hashedPassword,
      resetOtp: null,
      resetOtpExpires: null
    });

    res.status(200).json({ success: true, message: 'Password reset successful! You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during password reset' });
  }
};
