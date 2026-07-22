import React, { useState, useEffect } from 'react';
import GlassCard from '../components/GlassCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import API from '../utils/api';
import { FaTint, FaClock, FaBell, FaVolumeMute, FaPlus } from 'react-icons/fa';

const WaterReminder = () => {
  const [loading, setLoading] = useState(true);
  const [todayLog, setTodayLog] = useState(null);
  const [settings, setSettings] = useState(null);
  const [addLoading, setAddLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // Settings form states
  const [interval, setIntervalVal] = useState(60);
  const [enabled, setEnabled] = useState(true);

  const loadWaterStatus = async () => {
    try {
      const res = await API.get('/water');
      if (res.data.success) {
        setTodayLog(res.data.todayLog);
        setSettings(res.data.settings);
        setIntervalVal(res.data.settings.reminderIntervalMinutes);
        setEnabled(res.data.settings.reminderEnabled);
      }
    } catch (err) {
      console.error('Error loading water status:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWaterStatus();
  }, []);

  const handleAddWater = async (amount) => {
    setAddLoading(true);
    try {
      const res = await API.post('/water', { amountMl: amount });
      if (res.data.success) {
        setTodayLog(res.data.todayLog);
        // Prompt browser alert notification
        triggerBrowserAlert(amount);
      }
    } catch (err) {
      console.error('Error adding water:', err.message);
    } finally {
      setAddLoading(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    try {
      const res = await API.put('/water/settings', {
        reminderIntervalMinutes: interval,
        reminderEnabled: enabled
      });
      if (res.data.success) {
        setSettings(res.data.settings);
        alert('Hydration settings saved successfully!');
      }
    } catch (err) {
      console.error('Error updating settings:', err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleSnooze = async (minutes) => {
    try {
      const res = await API.put('/water/settings', { snoozeMinutes: minutes });
      if (res.data.success) {
        setSettings(res.data.settings);
        alert(`Reminders snoozed for ${minutes} minutes.`);
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  const triggerBrowserAlert = (amount) => {
    if (Notification.permission === 'granted') {
      new Notification('Hydration Logged', {
        body: `Logged +${amount}mL of water successfully! Keep drinking to hit your daily goal.`,
        icon: 'https://cdn-icons-png.flaticon.com/512/3100/3100227.png'
      });
    } else {
      console.log(`[BROWSER ALERT IN CONSOLE]: Logged +${amount}mL water.`);
    }
  };

  // Request browser notification permissions on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Hydration calculations
  const progressPercent = todayLog
    ? Math.min(100, Math.round((todayLog.intakeMl / todayLog.goalMl) * 100))
    : 0;

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h2 className="text-2xl font-extrabold font-sans">Hydration & Water Reminder</h2>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Track daily water intake, schedule drinking alerts, and manage kidney flushing cycles.
        </p>
      </div>

      {loading ? (
        <LoadingSkeleton count={3} height="h-20" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Intake tracker panel */}
          <div className="lg:col-span-2 space-y-6">
            <GlassCard className="text-center py-10 relative overflow-hidden">
              {/* Giant visual glass animation */}
              <div className="relative inline-flex items-center justify-center w-40 h-40 rounded-full border-4 border-primary-500/20 dark:border-primary-500/10 shadow-lg shadow-primary-500/5 mb-6">
                <div 
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-primary-400 to-blue-400 rounded-full transition-all duration-500 ease-out -z-10"
                  style={{ height: `${progressPercent}%` }}
                />
                <div className="flex flex-col items-center">
                  <span className="text-3xl font-black">{todayLog.intakeMl}</span>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase">
                    of {todayLog.goalMl} mL
                  </span>
                </div>
              </div>

              <div className="space-y-2 mb-8">
                <h3 className="text-lg font-bold">Daily Goal Progress: {progressPercent}%</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  {progressPercent >= 100 
                    ? '🎉 Goal reached! Superb hydration today. Your kidneys are flushing glucose efficiently.'
                    : 'Drink water consistently. Low hydration levels reduce glucose filtration rate.'}
                </p>
              </div>

              {/* Increments buttons */}
              <div className="flex flex-wrap justify-center gap-4">
                <button
                  onClick={() => handleAddWater(250)}
                  disabled={addLoading}
                  className="btn-secondary py-3 px-6 rounded-2xl flex items-center space-x-2 text-xs font-bold font-sans active:scale-95 transition-all shadow-sm"
                >
                  <FaTint className="text-blue-500 text-sm" />
                  <span>+250 mL (1 Cup)</span>
                </button>
                <button
                  onClick={() => handleAddWater(500)}
                  disabled={addLoading}
                  className="btn-secondary py-3 px-6 rounded-2xl flex items-center space-x-2 text-xs font-bold font-sans active:scale-95 transition-all shadow-sm"
                >
                  <FaTint className="text-blue-500 text-sm" />
                  <span>+500 mL (Bottle)</span>
                </button>
                <button
                  onClick={() => handleAddWater(750)}
                  disabled={addLoading}
                  className="btn-secondary py-3 px-6 rounded-2xl flex items-center space-x-2 text-xs font-bold font-sans active:scale-95 transition-all shadow-sm"
                >
                  <FaTint className="text-blue-500 text-sm" />
                  <span>+750 mL (Large)</span>
                </button>
              </div>
            </GlassCard>

            {/* Today logs items */}
            <GlassCard>
              <h3 className="font-bold text-sm mb-4">Today's Hydration Logs</h3>
              {todayLog.logs.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">
                  No water logged yet. Record your intake to begin tracking today's progress.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {todayLog.logs.map((log, index) => (
                    <div 
                      key={index}
                      className="p-3 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border border-slate-200/20 text-left relative overflow-hidden"
                    >
                      <FaTint className="absolute right-3 bottom-3 text-blue-500/10 text-3xl" />
                      <span className="block text-[10px] font-bold text-slate-400">{log.loggedAt}</span>
                      <span className="text-base font-extrabold text-blue-500">+{log.amountMl} mL</span>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </div>

          {/* Right column: settings and snooze control */}
          <div className="space-y-6">
            
            {/* Settings Form */}
            <GlassCard>
              <h3 className="font-bold text-sm mb-4 flex items-center space-x-2">
                <FaBell className="text-primary-500 text-xs" />
                <span>Water Alerts Configuration</span>
              </h3>

              <form onSubmit={handleSaveSettings} className="space-y-4 text-left">
                {/* Enabled checkbox */}
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setEnabled(e.target.checked)}
                    id="reminderEnabled"
                    className="w-4 h-4 text-primary-500 focus:ring-primary-500 rounded border-slate-300 dark:border-slate-800"
                  />
                  <label htmlFor="reminderEnabled" className="text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer">
                    Enable hydration notifications
                  </label>
                </div>

                {/* Interval select */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 pl-1">
                    Reminder Intervals
                  </label>
                  <select
                    value={interval}
                    onChange={(e) => setIntervalVal(parseInt(e.target.value))}
                    disabled={!enabled}
                    className="glass-input disabled:opacity-55"
                  >
                    <option value={30}>Every 30 Minutes</option>
                    <option value={60}>Every 1 Hour</option>
                    <option value={120}>Every 2 Hours</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={saveLoading}
                  className="btn-primary w-full py-2 px-4 rounded-xl text-xs font-bold"
                >
                  {saveLoading ? 'Saving...' : 'Save Settings'}
                </button>
              </form>
            </GlassCard>

            {/* Snooze Options */}
            <GlassCard>
              <h3 className="font-bold text-sm mb-4 flex items-center space-x-2">
                <FaVolumeMute className="text-primary-500 text-sm" />
                <span>Snooze Alerts</span>
              </h3>
              
              <p className="text-xs leading-relaxed text-slate-400 mb-4 text-left">
                Temporarily silence active browser water alarms. They will resume automatically after the snooze period.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleSnooze(30)}
                  className="btn-secondary py-2 px-3 rounded-xl text-xs font-semibold"
                >
                  Snooze 30 Mins
                </button>
                <button
                  onClick={() => handleSnooze(60)}
                  className="btn-secondary py-2 px-3 rounded-xl text-xs font-semibold"
                >
                  Snooze 1 Hour
                </button>
              </div>

              {settings?.snoozedUntil && (
                <div className="mt-4 p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold rounded-xl text-left flex items-center space-x-2">
                  <FaClock />
                  <span>Snoozed until {new Date(settings.snoozedUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              )}
            </GlassCard>

          </div>

        </div>
      )}
    </div>
  );
};

export default WaterReminder;
