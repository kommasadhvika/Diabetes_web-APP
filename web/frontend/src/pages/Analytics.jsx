import React, { useState, useEffect } from 'react';
import GlassCard from '../components/GlassCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import API from '../utils/api';
import { 
  FaChartBar, FaHeartbeat, FaTint, FaRunning, 
  FaUserShield, FaMedal, FaInfoCircle, FaExclamationCircle, FaSync
} from 'react-icons/fa';
import * as Icons from 'react-icons/fa';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get('/analytics');
      if (res.data.success) {
        setData(res.data);
      } else {
        setError(res.data.message || 'Failed to load analytics data.');
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err?.response?.data?.message || err.message || 'Network error loading analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  // Safe data accessors with defaults
  const sugarLogs   = data?.charts?.sugarLogs   || [];
  const waterLogs   = data?.charts?.waterLogs   || [];
  const sugarDist   = data?.charts?.sugarDist   || { NORMAL: 0, PREDIABETIC: 0, 'HIGH DIABETES RISK': 0 };
  const summary     = data?.summary             || {};
  const badges      = data?.badges              || [];

  // Chart 1: Sugar Level Trend
  const sugarLineData = {
    labels: sugarLogs.map(item => item.date),
    datasets: [
      {
        label: 'Glucose (mg/dL)',
        data: sugarLogs.map(item => item.value),
        borderColor: '#f43f5e',
        backgroundColor: 'rgba(244, 63, 94, 0.08)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#f43f5e',
        pointRadius: 4,
        pointHoverRadius: 6,
      }
    ]
  };

  // Chart 2: Water logs Bar
  const waterBarData = {
    labels: waterLogs.map(item => item.date),
    datasets: [
      {
        label: 'Logged Intake (mL)',
        data: waterLogs.map(item => item.intake),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderRadius: 8,
      },
      {
        label: 'Daily Goal Target',
        data: waterLogs.map(item => item.goal),
        backgroundColor: 'rgba(148, 163, 184, 0.25)',
        borderRadius: 8,
      }
    ]
  };

  // Chart 3: Doughnut sugar distribution
  const sugarDoughnutData = {
    labels: ['Normal', 'Prediabetic', 'High Risk'],
    datasets: [
      {
        data: [
          sugarDist.NORMAL || 0,
          sugarDist.PREDIABETIC || 0,
          sugarDist['HIGH DIABETES RISK'] || 0
        ],
        backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
        borderWidth: 0,
        hoverOffset: 6,
      }
    ]
  };

  const renderBadgeIcon = (iconName) => {
    const IconComponent = Icons[iconName] || FaMedal;
    return <IconComponent className="text-xl text-white" />;
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 } } },
      y: { grid: { color: 'rgba(148,163,184,0.1)' }, ticks: { font: { size: 10 } } }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold font-sans">Advanced Analytics Dashboard</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Analyze historical glucose logs, target values comparison, and explore health achievements.
          </p>
        </div>
        <button
          onClick={loadAnalytics}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-xl bg-primary-500/10 text-primary-500 hover:bg-primary-500/20 transition-colors disabled:opacity-50"
        >
          <FaSync className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <LoadingSkeleton count={4} height="h-20" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <LoadingSkeleton count={3} height="h-64" />
          </div>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <GlassCard className="flex flex-col items-center justify-center py-16 space-y-4 text-center">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center">
            <FaExclamationCircle className="text-3xl text-rose-500" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">Failed to Load Analytics</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md">{error}</p>
          </div>
          <button
            onClick={loadAnalytics}
            className="px-6 py-2.5 bg-primary-500 text-white text-xs font-bold rounded-xl hover:bg-primary-600 transition-colors flex items-center space-x-2"
          >
            <FaSync />
            <span>Retry</span>
          </button>
        </GlassCard>
      )}

      {/* Main content — shown when loaded successfully */}
      {!loading && !error && (
        <>
          {/* Stats counters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <GlassCard className="text-left py-4 px-5">
              <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Avg Fasting Glucose</span>
              <span className="text-xl font-black">{summary.avgFasting || '—'} <span className="text-sm font-semibold text-slate-400">mg/dL</span></span>
            </GlassCard>
            <GlassCard className="text-left py-4 px-5">
              <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Avg Post-Meal Glucose</span>
              <span className="text-xl font-black">{summary.avgPostMeal || '—'} <span className="text-sm font-semibold text-slate-400">mg/dL</span></span>
            </GlassCard>
            <GlassCard className="text-left py-4 px-5">
              <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Calories Burned</span>
              <span className="text-xl font-black text-emerald-500">{summary.totalCalBurned || 0} <span className="text-sm font-semibold">kcal</span></span>
            </GlassCard>
            <GlassCard className="text-left py-4 px-5">
              <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Mean Daily Hydration</span>
              <span className="text-xl font-black text-blue-500">{summary.avgWaterIntake || 0} <span className="text-sm font-semibold">mL</span></span>
            </GlassCard>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Sugar Line chart */}
            <GlassCard className="md:col-span-2 text-left">
              <h3 className="font-bold text-sm mb-4 flex items-center space-x-2 text-rose-500">
                <FaHeartbeat />
                <span>Glucose Trend Analysis (Last 7 Readings)</span>
              </h3>
              <div className="h-64">
                {sugarLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-xs text-slate-400 space-y-2">
                    <FaInfoCircle className="text-2xl opacity-40" />
                    <span>No glucose readings logged yet.</span>
                    <span className="text-[10px] opacity-60">Log your first blood sugar reading to see trends.</span>
                  </div>
                ) : (
                  <Line data={sugarLineData} options={chartOptions} />
                )}
              </div>
            </GlassCard>

            {/* Sugar Doughnut distribution */}
            <GlassCard className="text-left">
              <h3 className="font-bold text-sm mb-4 flex items-center space-x-2 text-emerald-500">
                <FaHeartbeat />
                <span>Glucose Distribution</span>
              </h3>
              <div className="h-64 relative flex items-center justify-center">
                {sugarLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-xs text-slate-400 space-y-2">
                    <FaInfoCircle className="text-2xl opacity-40" />
                    <span>No records found.</span>
                  </div>
                ) : (
                  <Doughnut 
                    data={sugarDoughnutData} 
                    options={{ 
                      responsive: true, 
                      maintainAspectRatio: false, 
                      plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } } 
                    }} 
                  />
                )}
              </div>
            </GlassCard>

            {/* Hydration Bar */}
            <GlassCard className="md:col-span-3 text-left">
              <h3 className="font-bold text-sm mb-4 flex items-center space-x-2 text-blue-500">
                <FaTint />
                <span>Water Intake vs Daily Goal Target</span>
              </h3>
              <div className="h-64">
                {waterLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-xs text-slate-400 space-y-2">
                    <FaInfoCircle className="text-2xl opacity-40" />
                    <span>No water intake logged yet.</span>
                    <span className="text-[10px] opacity-60">Start tracking daily hydration to see comparisons.</span>
                  </div>
                ) : (
                  <Bar 
                    data={waterBarData} 
                    options={{ 
                      responsive: true, 
                      maintainAspectRatio: false,
                      plugins: { legend: { position: 'top', labels: { boxWidth: 10, font: { size: 10 } } } },
                      scales: {
                        x: { grid: { display: false }, ticks: { font: { size: 10 } } },
                        y: { grid: { color: 'rgba(148, 163, 184, 0.1)' }, ticks: { font: { size: 10 } } }
                      }
                    }} 
                  />
                )}
              </div>
            </GlassCard>

          </div>

          {/* Gamified Achievement Badges */}
          <GlassCard className="text-left">
            <h3 className="font-bold text-sm mb-6 flex items-center space-x-2">
              <FaMedal className="text-primary-500 text-sm" />
              <span>Unlockable Achievement Badges</span>
            </h3>

            {badges.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-xs text-slate-400 space-y-2">
                <FaMedal className="text-3xl opacity-20" />
                <span>No badges data available.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {badges.map((badge) => (
                  <div
                    key={badge.id}
                    className={`p-5 rounded-2xl border flex items-center space-x-4 shadow-sm transition-all ${
                      badge.unlocked 
                        ? 'bg-white dark:bg-slate-900 border-slate-200/50 dark:border-slate-800' 
                        : 'bg-slate-100/50 dark:bg-slate-950/20 border-slate-200/20 opacity-55'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-tr ${
                      badge.unlocked ? badge.color : 'from-slate-300 to-slate-400 dark:from-slate-800 dark:to-slate-900'
                    } shadow-md flex-shrink-0`}>
                      {renderBadgeIcon(badge.icon)}
                    </div>
                    
                    <div className="space-y-0.5 text-left min-w-0">
                      <h4 className="font-extrabold text-xs text-slate-850 dark:text-slate-100 leading-snug truncate">
                        {badge.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed font-semibold">
                        {badge.description}
                      </p>
                      <span className={`inline-block text-[8px] font-extrabold uppercase mt-1 ${
                        badge.unlocked ? 'text-primary-500' : 'text-slate-400'
                      }`}>
                        {badge.unlocked ? '✓ Unlocked' : '🔒 Locked'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </>
      )}

    </div>
  );
};

export default Analytics;
