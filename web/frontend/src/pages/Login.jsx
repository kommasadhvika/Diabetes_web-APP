import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { FaHeartbeat, FaEnvelope, FaLock } from 'react-icons/fa';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');

  useEffect(() => {
    if (searchParams.get('expired')) {
      setInfoMessage('Your session has expired. Please sign in again.');
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setLoading(true);

    if (!email || !password) {
      setError('Please provide email and password');
      setLoading(false);
      return;
    }

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      navigate('/dashboard');
    } else {
      // Check if user is not verified
      if (res.message && res.message.toLowerCase().includes('not verified')) {
        navigate(`/verify-otp?email=${encodeURIComponent(email)}`);
      } else {
        setError(res.message || 'Invalid email or password');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background glow ball */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-primary-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md glass-panel p-8 md:p-10 text-center"
      >
        {/* Brand Icon */}
        <div className="inline-flex p-3 bg-gradient-to-tr from-primary-500 to-emerald-600 rounded-2xl text-white shadow-lg shadow-primary-500/20 mb-6">
          <FaHeartbeat className="text-2xl" />
        </div>
        <h2 className="text-2xl font-bold mb-1">Sign In to Dashboard</h2>
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-8">
          Enter details below to monitor your glucose logs.
        </p>

        {infoMessage && (
          <div className="p-3 mb-6 text-xs font-semibold text-amber-600 bg-amber-500/10 border border-amber-500/20 rounded-xl text-left">
            {infoMessage}
          </div>
        )}

        {error && (
          <div className="p-3 mb-6 text-xs font-semibold text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-xl text-left">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {/* Email */}
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

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5 pl-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-bold text-primary-500 hover:underline"
              >
                Forgot?
              </Link>
            </div>
            <div className="relative">
              <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="glass-input pl-11"
                required
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 mt-4 text-sm rounded-xl font-bold flex items-center justify-center space-x-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        <p className="mt-8 text-xs text-slate-500">
          Don't have an account?{' '}
          <Link to="/signup" className="font-bold text-primary-500 hover:underline">
            Register Here
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
