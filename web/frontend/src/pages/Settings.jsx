import React, { useState } from 'react';
import GlassCard from '../components/GlassCard';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { FaCog, FaSun, FaMoon, FaServer, FaShieldAlt } from 'react-icons/fa';

const Settings = () => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h2 className="text-2xl font-extrabold font-sans">Settings & Diagnostics</h2>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Modify visual themes, customize tracking parameters, and review system adapter indicators.
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6 text-left">
        
        {/* Theme select settings */}
        <GlassCard>
          <h3 className="font-bold text-sm mb-4 flex items-center space-x-2 text-primary-500">
            <FaCog />
            <span>Visual Themes Preferences</span>
          </h3>
          
          <div className="flex items-center justify-between p-3.5 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border border-slate-200/20">
            <div className="space-y-0.5">
              <span className="block text-xs font-bold text-slate-800 dark:text-white">Dark mode toggle</span>
              <span className="text-[10px] text-slate-400">Dim lights for comfortable evening browsing.</span>
            </div>

            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 shadow-sm flex items-center space-x-2 text-xs font-bold"
            >
              {theme === 'dark' ? (
                <>
                  <FaSun className="text-amber-500" />
                  <span>Light Theme</span>
                </>
              ) : (
                <>
                  <FaMoon className="text-blue-500" />
                  <span>Dark Theme</span>
                </>
              )}
            </button>
          </div>
        </GlassCard>

        {/* Database adapter Diagnostics info */}
        <GlassCard>
          <h3 className="font-bold text-sm mb-4 flex items-center space-x-2 text-primary-500">
            <FaServer />
            <span>Database Adapter Diagnostics</span>
          </h3>

          <div className="space-y-4 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            <p>
              Your database client is connected to: <strong>Local Fallback JSON Engine</strong>.
            </p>
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-slate-700 dark:text-slate-300 rounded-xl">
              ℹ️ <strong>Deployment Notice:</strong> When deploying to production on Render/Vercel, replace local files configurations with live Firebase Firestore project credentials by loading environment parameters in the configuration console.
            </div>
          </div>
        </GlassCard>

        {/* Account settings overview */}
        <GlassCard>
          <h3 className="font-bold text-sm mb-4 flex items-center space-x-2 text-primary-500">
            <FaShieldAlt />
            <span>Security Isolation</span>
          </h3>
          
          <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
            <p>
              All blood logs, scheduler calendar entries, and grocery checked states are cryptographically isolated per individual User ID token.
            </p>
            <p className="font-semibold text-slate-700 dark:text-slate-300">
              Account Registration ID: <span className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 py-0.5 px-2 rounded-lg">{user?.id}</span>
            </p>
          </div>
        </GlassCard>

      </div>

    </div>
  );
};

export default Settings;
