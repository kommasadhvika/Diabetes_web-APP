import React, { useState, useEffect } from 'react';
import GlassCard from '../components/GlassCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import API from '../utils/api';
import { useSocket } from '../context/SocketContext';
import { FaTrophy, FaFire, FaCalendarCheck, FaFilePdf, FaDownload, FaSpinner, FaPlus } from 'react-icons/fa';

const Gamification = () => {
  const { addListener, removeListener } = useSocket();
  const [loading, setLoading] = useState(true);
  
  // Gamification states
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [streaks, setStreaks] = useState([]);
  const [badges, setBadges] = useState([]);
  const [challenges, setChallenges] = useState([]);

  // Report states
  const [reports, setReports] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportsFetching, setReportsFetching] = useState(true);

  const loadGamificationDetails = async () => {
    try {
      const res = await API.get('/gamification/status');
      if (res.data.success) {
        setXp(res.data.xp || 0);
        setLevel(res.data.level || 1);
        setStreaks(res.data.streaks || []);
        setBadges(res.data.badges || []);
        setChallenges(res.data.challenges || []);
      }
    } catch (err) {
      console.error('Error fetching gamification details:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadReportHistory = async () => {
    try {
      const res = await API.get('/reports');
      if (res.data.success) {
        setReports(res.data.reports || []);
      }
    } catch (err) {
      console.error('Error fetching reports:', err.message);
    } finally {
      setReportsFetching(false);
    }
  };

  useEffect(() => {
    loadGamificationDetails();
    loadReportHistory();

    // Listen to real-time socket events for leveling/XP changes
    const handleXpUpdate = (data) => {
      console.log('[SOCKET] XP Updated:', data);
      setXp(data.xp);
      setLevel(data.level);
      // Reload details to update streaks or badges
      loadGamificationDetails();
    };

    const handleAchievementUnlock = (data) => {
      console.log('[SOCKET] Achievement unlocked:', data);
      loadGamificationDetails();
    };

    addListener('xpUpdated', handleXpUpdate);
    addListener('achievementUnlocked', handleAchievementUnlock);
    addListener('levelUp', loadGamificationDetails);

    return () => {
      removeListener('xpUpdated', handleXpUpdate);
      removeListener('achievementUnlocked', handleAchievementUnlock);
      removeListener('levelUp', loadGamificationDetails);
    };
  }, []);

  const handleGenerateReport = async () => {
    setReportLoading(true);
    try {
      const res = await API.post('/reports/generate');
      if (res.data.success) {
        alert('Weekly Health PDF report has been compiled and emailed to your inbox!');
        loadReportHistory();
      }
    } catch (err) {
      console.error('Manual report compilation failed:', err.message);
      alert(err.response?.data?.message || 'Error generating weekly health report. Check if your profile weight and height are complete!');
    } finally {
      setReportLoading(false);
    }
  };

  const handleDownloadReport = async (filename) => {
    try {
      // Direct file fetch and stream trigger
      const response = await API.get(`/reports/download/${filename}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Download error:', err.message);
      alert('Error fetching report download file.');
    }
  };

  // XP Progress Calculation (500 XP per Level)
  const currentLevelMinXp = (level - 1) * 500;
  const nextLevelMinXp = level * 500;
  const levelProgressXp = xp - currentLevelMinXp;
  const levelProgressPercent = Math.min(100, Math.round((levelProgressXp / 500) * 100));

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h2 className="text-2xl font-extrabold font-sans">Achievements & Progress Journey</h2>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Earn health experience points (XP), keep daily streaks active, unlock achievement badges, and export clinical weekly PDF summaries.
        </p>
      </div>

      {loading ? (
        <LoadingSkeleton count={3} height="h-28" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Gamification Center */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Level & XP Gauge */}
            <GlassCard className="text-left relative overflow-hidden">
              <FaTrophy className="absolute right-6 top-6 text-yellow-500/10 text-9xl -z-10" />
              <div className="flex items-center space-x-5">
                <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl flex flex-col items-center justify-center text-white shadow-lg shadow-amber-500/15">
                  <span className="text-[10px] font-bold uppercase tracking-wide">LEVEL</span>
                  <span className="text-3xl font-black leading-none">{level}</span>
                </div>
                <div className="flex-1">
                  <span className="text-xs font-bold text-slate-400">Total Progress Balance: {xp} XP</span>
                  <h3 className="text-lg font-black mt-0.5 text-slate-800 dark:text-slate-200">Level {level} Journey</h3>
                  
                  {/* Progress Gauge */}
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-3.5 rounded-full overflow-hidden mt-3">
                    <div 
                      className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 transition-all duration-500 ease-out"
                      style={{ width: `${levelProgressPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1.5 font-semibold">
                    <span>{currentLevelMinXp} XP</span>
                    <span>{levelProgressXp} / 500 XP ({levelProgressPercent}%)</span>
                    <span>{nextLevelMinXp} XP</span>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Daily Challenges Checklist */}
            <GlassCard className="text-left">
              <h3 className="font-bold text-sm mb-4 flex items-center space-x-2">
                <FaCalendarCheck className="text-primary-500 text-xs" />
                <span>Active Daily Health Challenges</span>
              </h3>

              <div className="space-y-3">
                {(challenges || []).map((challenge) => (
                  <div 
                    key={challenge.id}
                    className={`p-3.5 border rounded-xl flex items-center justify-between transition-colors ${
                      challenge.completed 
                        ? 'bg-emerald-500/5 border-emerald-500/15 text-slate-600 dark:text-slate-400' 
                        : 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-200/40 dark:border-slate-800/40'
                    }`}
                  >
                    <div className="flex items-start space-x-3 text-left">
                      <input 
                        type="checkbox" 
                        checked={challenge.completed} 
                        readOnly 
                        className="w-4 h-4 rounded text-emerald-500 border-slate-300 dark:border-slate-800 mt-0.5 pointer-events-none focus:ring-transparent"
                      />
                      <div>
                        <span className={`block text-xs font-bold ${challenge.completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>
                          {challenge.title}
                        </span>
                        <span className="block text-[10px] text-slate-400 mt-0.5">{challenge.description}</span>
                      </div>
                    </div>
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border ${
                      challenge.completed 
                        ? 'bg-slate-100 text-slate-400 border-transparent' 
                        : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                    }`}>
                      +{challenge.xpReward} XP
                    </span>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Streak Counters Grid */}
            <GlassCard className="text-left">
              <h3 className="font-bold text-sm mb-4 flex items-center space-x-2">
                <FaFire className="text-orange-500 text-xs" />
                <span>Continuous Compliance Streaks</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {['sugar', 'water', 'exercise', 'food_scan'].map((type) => {
                  const s = (streaks || []).find(x => x.type === type);
                  const count = s ? s.count : 0;
                  const names = {
                    sugar: 'Glucose Logs',
                    water: 'Water Logs',
                    exercise: 'Workouts',
                    food_scan: 'Food Scans'
                  };
                  return (
                    <div key={type} className="p-3 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200/20 rounded-xl relative overflow-hidden">
                      <FaFire className={`absolute right-2.5 bottom-2.5 text-3xl ${count > 0 ? 'text-orange-500/15' : 'text-slate-300/15 dark:text-slate-700/5'}`} />
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide">{names[type]}</span>
                      <span className="block text-2xl font-black mt-1 text-slate-800 dark:text-slate-200">
                        {count} <span className="text-xs font-normal text-slate-400">days</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </GlassCard>

          </div>

          {/* Right Column: Badges & Weekly Reports Compile */}
          <div className="space-y-6">
            
            {/* Badges Drawer */}
            <GlassCard className="text-left">
              <h3 className="font-bold text-sm mb-4 flex items-center space-x-2">
                <FaTrophy className="text-primary-500 text-xs" />
                <span>Achievement Badge Vault</span>
              </h3>

              <div className="space-y-3.5">
                {(badges || []).map((badge) => (
                  <div 
                    key={badge.id} 
                    className={`flex items-center space-x-3.5 p-3.5 border rounded-xl ${
                      badge.unlocked 
                        ? 'bg-emerald-500/5 border-emerald-500/15' 
                        : 'bg-slate-50/20 dark:bg-slate-900/10 border-slate-200/20 dark:border-slate-800/10 grayscale opacity-45'
                    }`}
                  >
                    <div className="text-3xl p-1.5 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200/10">
                      {badge.icon}
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <h4 className="text-xs font-bold truncate">{badge.name}</h4>
                      <p className="text-[10px] text-slate-400 leading-normal mt-0.5">{badge.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Weekly PDF Report compiler card */}
            <GlassCard className="text-left">
              <h3 className="font-bold text-sm mb-4 flex items-center space-x-2">
                <FaFilePdf className="text-primary-500 text-xs" />
                <span>Weekly Analytics Digest</span>
              </h3>
              
              <p className="text-[11px] leading-relaxed text-slate-400 mb-4">
                Compile your historical tracking statistics into a medical-grade PDF progress summary containing active physician advice. Copies are automatically emailed to your registered address.
              </p>

              <button
                onClick={handleGenerateReport}
                disabled={reportLoading}
                className="btn-primary w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 shadow-sm active:scale-95 transition-all"
              >
                {reportLoading ? (
                  <>
                    <FaSpinner className="animate-spin text-sm" />
                    <span>Compiling Report...</span>
                  </>
                ) : (
                  <>
                    <FaFilePdf className="text-sm" />
                    <span>Compile & Email Weekly PDF</span>
                  </>
                )}
              </button>

              {/* Generated reports downloads panel */}
              <div className="mt-5 border-t border-slate-200/30 dark:border-slate-800/30 pt-4">
                <span className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wide">Download History</span>
                
                {reportsFetching ? (
                  <FaSpinner className="animate-spin text-primary-500 mx-auto block my-2" />
                ) : (reports || []).length === 0 ? (
                  <span className="block text-[10px] text-slate-400 text-center py-2">No generated PDFs compiled yet.</span>
                ) : (
                  <div className="max-h-36 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                    {(reports || []).map((report) => (
                      <div 
                        key={report.id}
                        className="flex justify-between items-center p-2 bg-slate-50/50 dark:bg-slate-900/40 rounded-lg border border-slate-200/10 text-xs"
                      >
                        <span className="truncate max-w-[150px] font-semibold text-[11px] text-slate-600 dark:text-slate-400">
                          {new Date(report.generatedAt).toLocaleDateString()} Report
                        </span>
                        <button 
                          onClick={() => handleDownloadReport(report.fileName)}
                          className="p-1 hover:text-primary-500 text-slate-400 transition-colors"
                          title="Download PDF"
                        >
                          <FaDownload className="text-xs" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </GlassCard>

          </div>

        </div>
      )}
    </div>
  );
};

export default Gamification;

