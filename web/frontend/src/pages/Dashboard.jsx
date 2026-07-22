import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import GlassCard from '../components/GlassCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { 
  FaHeartbeat, FaTint, FaRunning, FaUserMd, 
  FaAngleRight, FaStar, FaLightbulb, FaPlus,
  FaTrophy, FaRobot, FaCamera, FaCalculator, FaFilePdf, FaFire
} from 'react-icons/fa';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addListener, removeListener } = useSocket();

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [stats, setStats] = useState(null);
  const [gamification, setGamification] = useState(null);
  const [avgGlucose, setAvgGlucose] = useState(120);

  const loadDashboardData = async () => {
    try {
      const [reportRes, analyticsRes, gamificationRes, sugarRes] = await Promise.all([
        API.get('/sugar/report'),
        API.get('/analytics'),
        API.get('/gamification/status'),
        API.get('/sugar')
      ]);

      if (reportRes.data.success) {
        setReport(reportRes.data.report);
      }
      if (analyticsRes.data.success) {
        setStats(analyticsRes.data.summary);
      }
      if (gamificationRes.data.success) {
        setGamification(gamificationRes.data);
      }
      if (sugarRes.data.success && sugarRes.data.readings?.length > 0) {
        const readings = sugarRes.data.readings;
        const avg = Math.round(readings.reduce((sum, r) => sum + r.value, 0) / readings.length);
        setAvgGlucose(avg);
      }
    } catch (err) {
      console.error('Error loading dashboard info:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    // Listen to real-time events to reload data dynamically
    const refreshData = () => {
      loadDashboardData();
    };

    addListener('sugarReadingAdded', refreshData);
    addListener('waterIntakeUpdated', refreshData);
    addListener('exerciseLogged', refreshData);
    addListener('xpUpdated', refreshData);
    addListener('levelUp', refreshData);

    return () => {
      removeListener('sugarReadingAdded', refreshData);
      removeListener('waterIntakeUpdated', refreshData);
      removeListener('exerciseLogged', refreshData);
      removeListener('xpUpdated', refreshData);
      removeListener('levelUp', refreshData);
    };
  }, []);

  // Calculate estimated HbA1c
  const hba1c = ((avgGlucose + 46.7) / 28.7).toFixed(1);

  // Get color for Health Score
  const getHealthScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-500 border-emerald-500';
    if (score >= 60) return 'text-amber-500 border-amber-500';
    return 'text-rose-500 border-rose-500';
  };

  const getRiskLevelColor = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'low': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'medium': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'high': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  // XP Progress Calculation
  const currentLevel = gamification?.level || 1;
  const currentXp = gamification?.xp || 0;
  const levelProgressXp = currentXp - (currentLevel - 1) * 500;
  const levelProgressPercent = Math.min(100, Math.round((levelProgressXp / 500) * 100));

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton count={1} height="h-20" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <LoadingSkeleton count={4} height="h-24" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <LoadingSkeleton count={2} height="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-primary-500 to-emerald-600 rounded-3xl text-white shadow-xl shadow-primary-500/10 text-left relative overflow-hidden">
        <div className="space-y-1 z-10">
          <h2 className="text-xl md:text-2xl font-black">AI Endocrinology Platform Active</h2>
          <p className="text-xs opacity-90 max-w-xl leading-relaxed">
            Welcome back, {user?.name || 'User'}. Your health streams are synced in real-time. Consult our endocrinology chatbot, upload meals to scan macros, or check challenges progress below.
          </p>
        </div>
        <div className="flex space-x-3 z-10 self-end sm:self-center">
          <Link 
            to="/chatbot" 
            className="bg-white/20 hover:bg-white/30 border border-white/20 text-white font-bold text-xs py-3 px-5 rounded-2xl flex items-center space-x-1.5 transition-all shadow-md active:scale-95 whitespace-nowrap"
          >
            <FaRobot />
            <span>Consult AI</span>
          </Link>
          <Link 
            to="/sugar-tracking" 
            className="bg-white text-primary-600 hover:bg-slate-50 font-bold text-xs py-3 px-5 rounded-2xl flex items-center space-x-1.5 transition-all shadow-md active:scale-95 whitespace-nowrap"
          >
            <FaPlus />
            <span>Add Sugar Log</span>
          </Link>
        </div>
        {/* Glow ball bubble */}
        <div className="absolute right-0 top-0 w-48 h-48 bg-white/10 rounded-full blur-2xl -z-0 translate-x-12 -translate-y-12" />
      </div>

      {/* Grid: 4 Quick Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Sugar */}
        <GlassCard 
          hover={true} 
          onClick={() => navigate('/sugar-tracking')} 
          className="flex items-center space-x-4 cursor-pointer text-left"
        >
          <div className="p-3.5 bg-rose-500/10 rounded-2xl text-rose-500">
            <FaHeartbeat className="text-2xl" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Avg Glucose
            </span>
            <span className="text-lg font-black text-slate-800 dark:text-white">
              {avgGlucose > 0 ? `${avgGlucose} mg/dL` : '—'}
            </span>
            <span className="block text-[9px] text-slate-400">Target: &lt;100 mg/dL</span>
          </div>
        </GlassCard>

        {/* Card 2: Water */}
        <GlassCard 
          hover={true} 
          onClick={() => navigate('/water-tracker')} 
          className="flex items-center space-x-4 cursor-pointer text-left"
        >
          <div className="p-3.5 bg-blue-500/10 rounded-2xl text-blue-500">
            <FaTint className="text-2xl" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Today's Water
            </span>
            <span className="text-lg font-black text-slate-800 dark:text-white">
              {stats?.avgWaterIntake ? `${stats.avgWaterIntake} mL` : '0 mL'}
            </span>
            <span className="block text-[9px] text-slate-400">Target: ~2500 mL</span>
          </div>
        </GlassCard>

        {/* Card 3: Exercises */}
        <GlassCard 
          hover={true} 
          onClick={() => navigate('/exercise')} 
          className="flex items-center space-x-4 cursor-pointer text-left"
        >
          <div className="p-3.5 bg-amber-500/10 rounded-2xl text-amber-500">
            <FaRunning className="text-2xl" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Tracked Workouts
            </span>
            <span className="text-lg font-black text-slate-800 dark:text-white">
              {stats ? `${stats.totalExerciseMin} Mins` : '0 Mins'}
            </span>
            <span className="block text-[9px] text-slate-400">Activity duration logged</span>
          </div>
        </GlassCard>

        {/* Card 4: HbA1c forecast */}
        <GlassCard 
          hover={true} 
          onClick={() => navigate('/calculators')} 
          className="flex items-center space-x-4 cursor-pointer text-left"
        >
          <div className="p-3.5 bg-indigo-500/10 rounded-2xl text-indigo-500">
            <FaCalculator className="text-2xl" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              HbA1c Estimate
            </span>
            <span className="text-lg font-black text-slate-800 dark:text-white">
              {avgGlucose > 0 ? `${hba1c}%` : '—'}
            </span>
            <span className="block text-[9px] text-slate-400">Target: &lt;6.5%</span>
          </div>
        </GlassCard>
      </div>

      {/* Main Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Health Score Meter & Gamification Progress */}
        <div className="space-y-6">
          {/* Health Score Circle */}
          <GlassCard className="text-center flex flex-col justify-center items-center py-6">
            <h3 className="font-bold text-sm text-slate-400 uppercase tracking-widest mb-4">
              Overall Health Score
            </h3>
            
            <div className={`w-32 h-32 rounded-full border-[8px] flex items-center justify-center mb-4 shadow-inner ${getHealthScoreColor(report?.healthScore || 75)}`}>
              <div className="flex flex-col items-center">
                <span className="text-3xl font-black text-slate-800 dark:text-white">
                  {report ? report.healthScore : '75'}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Points</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className={`inline-block px-3 py-0.5 text-xs font-bold rounded-full border ${getRiskLevelColor(report?.riskLevel)}`}>
                {report ? report.riskLevel : 'Low'} Risk Level
              </span>
              <p className="text-[10px] leading-relaxed text-slate-400 max-w-[200px] mx-auto">
                Formulated from glycemic readings, activity levels, and cardiac parameters.
              </p>
            </div>
          </GlassCard>

          {/* Gamification summary widget */}
          <GlassCard className="text-left py-5">
            <h3 className="font-bold text-sm mb-3.5 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <FaTrophy className="text-yellow-500 text-xs" />
                <span>Level {currentLevel} Advisor</span>
              </span>
              <span className="text-[10px] text-slate-400 font-bold">{currentXp} XP</span>
            </h3>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mb-2">
              <div 
                className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 transition-all duration-300"
                style={{ width: `${levelProgressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-slate-400 font-bold">
              <span>{levelProgressXp} / 500 XP to Level {currentLevel + 1}</span>
              <span>{levelProgressPercent}%</span>
            </div>

            {/* Streaks mini-widget */}
            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-200/20 dark:border-slate-800/20">
              <div className="flex items-center space-x-2">
                <FaFire className="text-orange-500 text-sm" />
                <div>
                  <span className="block text-[9px] font-bold text-slate-400">GLUCOSE STREAK</span>
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                    {gamification?.streaks?.find(s => s.type === 'sugar')?.count || 0} Days
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <FaFire className="text-orange-500 text-sm" />
                <div>
                  <span className="block text-[9px] font-bold text-slate-400">WATER STREAK</span>
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                    {gamification?.streaks?.find(s => s.type === 'water')?.count || 0} Days
                  </span>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Right Column: AI Recommendations & Quick Links */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Advisor Panel */}
          <GlassCard className="text-left">
            <h3 className="font-bold text-sm mb-4 flex items-center space-x-2 text-primary-500">
              <FaLightbulb className="text-base animate-pulse" />
              <span>Smart Recommendation Engine Insights</span>
            </h3>

            {report?.tips && report.tips.length > 0 ? (
              <div className="space-y-3">
                
                {/* Trend Alert message */}
                {report.trendMessage && (
                  <div className="p-3.5 bg-primary-500/10 border border-primary-500/20 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl leading-relaxed">
                    📊 {report.trendMessage}
                  </div>
                )}

                {/* Specific Tips List */}
                <div className="space-y-2.5">
                  <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">
                    Daily Actions Checklist
                  </span>
                  {report.tips.slice(0, 3).map((tip, idx) => (
                    <div 
                      key={idx}
                      className="p-3 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border border-slate-200/20 text-xs leading-relaxed text-slate-600 dark:text-slate-400 flex items-start space-x-2.5"
                    >
                      <FaStar className="text-amber-500 text-sm mt-0.5 flex-shrink-0" />
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>

              </div>
            ) : (
              <p className="text-xs text-slate-400">Log sugar checkups to generate smart insights reports.</p>
            )}
          </GlassCard>

          {/* AI Features & Gamification Navigation Cards */}
          <GlassCard>
            <h3 className="font-bold text-sm mb-4 text-left">Advanced Platforms Modules</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <Link
                to="/chatbot"
                className="p-3 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-2xl border border-slate-200/20 text-left transition-colors flex flex-col justify-between min-h-[90px] group"
              >
                <div className="p-2 bg-primary-500/10 rounded-xl text-primary-500 w-fit">
                  <FaRobot className="text-sm" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-800 dark:text-white mt-2">AI Chatbot</span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Clinical STT/TTS Chat</span>
                </div>
              </Link>

              <Link
                to="/food-scanner"
                className="p-3 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-2xl border border-slate-200/20 text-left transition-colors flex flex-col justify-between min-h-[90px] group"
              >
                <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500 w-fit">
                  <FaCamera className="text-sm" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-800 dark:text-white mt-2">Food Scanner</span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Gemini Vision scan</span>
                </div>
              </Link>

              <Link
                to="/calculators"
                className="p-3 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-2xl border border-slate-200/20 text-left transition-colors flex flex-col justify-between min-h-[90px] group"
              >
                <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-500 w-fit">
                  <FaCalculator className="text-sm" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-800 dark:text-white mt-2">Calculators</span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">BMI/BMR/HbA1c</span>
                </div>
              </Link>

              <Link
                to="/gamification"
                className="p-3 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-2xl border border-slate-200/20 text-left transition-colors flex flex-col justify-between min-h-[90px] group"
              >
                <div className="p-2 bg-yellow-500/10 rounded-xl text-yellow-500 w-fit">
                  <FaTrophy className="text-sm" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-800 dark:text-white mt-2">Challenges</span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">XP Badges & PDF digest</span>
                </div>
              </Link>
            </div>
          </GlassCard>

        </div>

      </div>

    </div>
  );
};

export default Dashboard;
