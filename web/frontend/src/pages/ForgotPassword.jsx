import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaKey, FaEnvelope, FaLock, FaCheckCircle } from 'react-icons/fa';
import API from '../utils/api';

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [step, setStep] = useState(1); // 1 = Request code, 2 = Enter code & new pass
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await API.post('/auth/forgot-password', { email });
      if (res.data.success) {
        setSuccess('Reset verification code sent to your email.');
        setStep(2);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error requesting reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const res = await API.post('/auth/reset-password', { email, resetOtp, newPassword });
      if (res.data.success) {
        setSuccess('Password updated successfully! Redirecting...');
        setTimeout(() => {
          navigate('/login');
        }, 2500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-slate-50 to-emerald-50 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background glow ball */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-primary-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md glass-panel p-8 md:p-10 text-center"
      >
        <div className="inline-flex p-3 bg-gradient-to-tr from-primary-500 to-emerald-600 rounded-2xl text-white shadow-lg mb-6">
          <FaKey className="text-xl animate-pulse" />
        </div>
        <h2 className="text-2xl font-bold mb-1">Recover Password</h2>
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-8">
          {step === 1 ? 'Enter your email to request a reset code.' : 'Enter the code and specify a new secure password.'}
        </p>

        {/* Development Helper Banner */}
        {step === 2 && (
          <div className="p-3 mb-6 text-[10px] leading-relaxed text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl text-left">
            💡 <strong>Development Mode:</strong> Reset token was logged to the <strong>backend console</strong> logs.
          </div>
        )}

        {error && (
          <div className="p-3 mb-6 text-xs font-semibold text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-xl text-left">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 mb-6 text-xs font-semibold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-left">
            {success}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRequestCode} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 pl-1">
                Email Address
              </label>
              <div className="relative">
                <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="johndoe@example.com"
                  className="glass-input pl-11"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 mt-4 text-sm rounded-xl font-bold flex items-center justify-center space-x-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <span>Request OTP Code</span>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4 text-left">
            {/* OTP Code */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 pl-1">
                Reset OTP Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={resetOtp}
                onChange={(e) => setResetOtp(e.target.value)}
                placeholder="123456"
                className="glass-input text-center text-lg font-bold tracking-[8px] focus:tracking-[8px]"
                required
              />
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 pl-1">
                Specify New Password
              </label>
              <div className="relative">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="glass-input pl-11"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 mt-4 text-sm rounded-xl font-bold flex items-center justify-center space-x-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <span>Update Password</span>
              )}
            </button>
          </form>
        )}

        <p className="mt-8 text-xs text-slate-500">
          Remember your credentials?{' '}
          <Link to="/login" className="font-bold text-primary-500 hover:underline">
            Back to Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
