import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaHeartbeat, FaAppleAlt, FaRunning, FaTint, FaUserShield, FaChartLine } from 'react-icons/fa';

const Landing = () => {
  const features = [
    {
      title: "AI Sugar Tracking",
      desc: "Log your blood sugar values and let our AI instantly analyze normal, prediabetic, and diabetic risk scales.",
      icon: FaHeartbeat,
      color: "text-rose-500 bg-rose-500/10"
    },
    {
      title: "Customized Diet Plans",
      desc: "Auto-generate 7-day meal rotations (Vegetarian/Non-Vegetarian/Indian/International) matching calorie limits.",
      icon: FaAppleAlt,
      color: "text-emerald-500 bg-emerald-500/10"
    },
    {
      title: "Personalized Workouts",
      desc: "Get interactive cardiovascular, walking, and yoga routines complete with timers and rep counters.",
      icon: FaRunning,
      color: "text-amber-500 bg-amber-500/10"
    },
    {
      title: "Smart Water Reminders",
      desc: "Track hydration volume with configurable snooze alarms, desktop push notifications, and analytics.",
      icon: FaTint,
      color: "text-blue-500 bg-blue-500/10"
    },
    {
      title: "Analytics Dashboard",
      desc: "Check historical health trends via responsive bar, line, and pie charts with achievements badges.",
      icon: FaChartLine,
      color: "text-indigo-500 bg-indigo-500/10"
    },
    {
      title: "Secure Isolation",
      desc: "Enterprise architecture. All blood logs, diet profiles, and clinic appointments are fully isolated.",
      icon: FaUserShield,
      color: "text-teal-500 bg-teal-500/10"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-800 dark:text-slate-200 transition-colors">
      
      {/* Top Header */}
      <header className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-gradient-to-tr from-primary-500 to-emerald-600 rounded-xl text-white shadow-md">
            <FaHeartbeat className="text-xl" />
          </div>
          <span className="font-extrabold text-xl bg-gradient-to-r from-primary-600 to-emerald-500 bg-clip-text text-transparent">
            DiaPredict AI
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <Link to="/login" className="text-sm font-semibold hover:text-primary-500 dark:hover:text-primary-400">
            Sign In
          </Link>
          <Link to="/signup" className="btn-primary py-2 px-5 text-sm rounded-xl">
            Get Started Free
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center relative overflow-hidden">
        {/* Glow blur bubbles */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary-500/10 rounded-full blur-[100px] pointer-events-none -z-10" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6"
        >
          <span className="inline-block px-4 py-1.5 bg-primary-500/10 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 font-bold text-xs rounded-full uppercase tracking-wider">
            ✨ Next-Gen Healthcare SaaS
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight max-w-4xl mx-auto">
            Take Control of Your Diabetes With{" "}
            <span className="bg-gradient-to-r from-primary-500 to-emerald-500 bg-clip-text text-transparent">
              AI Smart Engine
            </span>
          </h1>
          <p className="text-base md:text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Diagnose sugar level trends, track nutritional meals, log exercise routines, and manage doctor checkups with our unified, premium healthcare assistant.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link to="/signup" className="btn-primary py-3.5 px-8 text-base rounded-xl w-full sm:w-auto">
              Start Free Trial
            </Link>
            <Link to="/login" className="btn-secondary py-3.5 px-8 text-base rounded-xl w-full sm:w-auto">
              Sign In to Account
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Core Features Grid */}
      <section className="max-w-7xl mx-auto px-6 py-20 border-t border-slate-200/40 dark:border-slate-800/20">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl font-bold">Comprehensive Health Management</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
            Everything you need to monitor, control, and reduce diabetes risks, built with cutting-edge medical science.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feat, index) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="glass-panel p-8 glass-card-hover text-left flex flex-col justify-between"
            >
              <div>
                <div className={`p-3.5 w-12 h-12 rounded-xl flex items-center justify-center ${feat.color} mb-6`}>
                  <feat.icon className="text-xl" />
                </div>
                <h3 className="font-bold text-lg mb-3">{feat.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  {feat.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Health Stats Overview Section */}
      <section className="max-w-5xl mx-auto px-6 py-16 bg-gradient-to-tr from-primary-500/5 to-emerald-500/5 border border-primary-500/10 rounded-3xl text-center space-y-6 mb-24 relative overflow-hidden">
        <h2 className="text-2xl md:text-3xl font-extrabold">Ready to begin your wellness journey?</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Create your account today. Seeded food guides and exercise catalog are populated instantly to start tracking right away.
        </p>
        <div>
          <Link to="/signup" className="btn-primary py-3 px-8 text-sm inline-block rounded-xl">
            Get Started Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200/50 dark:border-slate-800/20 py-10 text-center text-xs text-slate-400 dark:text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} DiaPredict AI. All rights reserved.</p>
          <div className="flex space-x-6">
            <a href="#" className="hover:underline">Privacy Policy</a>
            <a href="#" className="hover:underline">Terms of Service</a>
            <a href="#" className="hover:underline">Disclaimer</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
