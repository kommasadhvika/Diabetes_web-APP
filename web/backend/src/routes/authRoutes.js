import express from 'express';
import { signup, verifyOtp, resendOtp, login, forgotPassword, resetPassword } from '../controllers/authController.js';
import { validateSignup, validateLogin } from '../middleware/validator.js';

const router = express.Router();

router.post('/signup', validateSignup, signup);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/login', validateLogin, login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
