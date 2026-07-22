import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { FaHeartbeat, FaKey } from 'react-icons/fa';
import API from '../utils/api';

const OtpVerification = () => {
  const { verifyOtp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    if (!email) {
      navigate('/signup');
    }
  }, [email, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    if (otp.length !== 6 || isNaN(otp)) {
      setError('Please enter a valid 6-digit OTP code');
      setLoading(false);
      return;
    }

    const res = await verifyOtp(email, otp);
    setLoading(false);

    if (res.success) {
      navigate('/dashboard');
    } else {
      setError(res.message || 'OTP verification failed');
    }
  };

  const handleResend = async () => {
    setError('');
    setSuccessMsg('');
    setResendLoading(true);

    try {
      const res = await API.post('/auth/resend-otp', { email });
      if (res.data.success) {
        setSuccessMsg('A new verification code has been emailed to you.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error resending OTP');
    } finally {
      setResendLoading(false);
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
          <FaKey className="text-xl" />
        </div>
        <h2 className="text-2xl font-bold mb-1">Verify Email</h2>
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">
          We have sent a 6-digit confirmation code to <span className="font-bold text-slate-600 dark:text-slate-300">{email}</span>.
        </p>

        {/* Development Helper Banner */}
        <div className="p-3.5 mb-6 text-[11px] leading-relaxed text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl text-left">
          💡 <strong>Development Mode:</strong> Since SMTP might be unconfigured, check the <strong>backend terminal logs</strong> to view the generated OTP!
        </div>

        {error && (
          <div className="p-3 mb-4 text-xs font-semibold text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-xl text-left">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-3 mb-4 text-xs font-semibold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-left">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 pl-1 text-center">
              Enter 6-Digit OTP
            </label>
            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123456"
              className="glass-input text-center text-xl font-bold tracking-[8px] focus:tracking-[8px]"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 mt-2 text-sm rounded-xl font-bold flex items-center justify-center space-x-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <span>Verify OTP</span>
            )}
          </button>
        </form>

        <div className="mt-8 text-xs text-slate-500 flex items-center justify-between">
          <button
            onClick={handleResend}
            disabled={resendLoading}
            className="font-bold text-primary-500 hover:underline disabled:opacity-50"
          >
            {resendLoading ? 'Requesting...' : 'Resend Code'}
          </button>
          <button
            onClick={() => navigate('/signup')}
            className="hover:underline text-slate-400"
          >
            Change Email
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default OtpVerification;
