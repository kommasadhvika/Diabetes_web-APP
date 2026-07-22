import React, { useState, useEffect, useRef } from 'react';
import GlassCard from '../components/GlassCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import API from '../utils/api';
import { FaRunning, FaPlay, FaPause, FaRedo, FaPlus, FaCalendarCheck, FaInfoCircle, FaExternalLinkAlt, FaClock } from 'react-icons/fa';

const Exercise = () => {
  const [exercises, setExercises] = useState([]);
  const [exerciseLogs, setExerciseLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active workout tracker
  const [activeExercise, setActiveExercise] = useState(null);
  
  // Timer state
  const [timerRunning, setTimerRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [initialTime, setInitialTime] = useState(0);
  const [reps, setReps] = useState(0);
  const [loggingState, setLoggingState] = useState(false);

  const timerRef = useRef(null);

  const loadData = async () => {
    try {
      const [exRes, logRes] = await Promise.all([
        API.get('/exercises'),
        API.get('/exercises/log')
      ]);

      if (exRes.data.success) setExercises(exRes.data.exercises);
      if (logRes.data.success) setExerciseLogs(logRes.data.logs);
    } catch (err) {
      console.error('Error loading exercises:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    return () => clearInterval(timerRef.current);
  }, []);

  // Timer runner
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setTimerRunning(false);
            clearInterval(timerRef.current);
            alert('Workout timer completed! Good job.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerRunning]);

  const handleStartWorkout = (ex) => {
    setActiveExercise(ex);
    const seconds = ex.durationMinutes * 60;
    setTimeLeft(seconds);
    setInitialTime(seconds);
    setTimerRunning(true);
    setReps(0);
  };

  const handleToggleTimer = () => {
    setTimerRunning(!timerRunning);
  };

  const handleResetTimer = () => {
    setTimerRunning(false);
    setTimeLeft(initialTime);
  };

  const handleAddRep = () => {
    setReps(prev => prev + 1);
  };

  const handleLogWorkout = async () => {
    if (!activeExercise) return;
    setLoggingState(true);

    const durationDone = Math.round((initialTime - timeLeft) / 60) || 1;
    // Estimate calories: 6.5 kcal/min
    const caloriesBurned = Math.round(durationDone * 6.5);

    try {
      const res = await API.post('/exercises/log', {
        exerciseId: activeExercise.id,
        name: activeExercise.name,
        category: activeExercise.category,
        durationMinutes: durationDone,
        repsCompleted: reps,
        caloriesBurned: caloriesBurned
      });

      if (res.data.success) {
        alert('Workout logged successfully!');
        // Reset workout panel
        setActiveExercise(null);
        setTimerRunning(false);
        // Refresh logs list
        loadData();
      }
    } catch (err) {
      console.error('Error logging exercise:', err.message);
    } finally {
      setLoggingState(false);
    }
  };

  // Convert seconds to MM:SS format
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      
      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-extrabold font-sans">Exercise & Physical Training</h2>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Unlock customized cardiorespiratory and stretching workouts tailored to glucose sensitivity.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: List of available routines */}
        <div className="lg:col-span-2 space-y-6">
          <GlassCard>
            <h3 className="font-bold text-sm mb-4">Recommended Workout Plans</h3>
            
            <div className="space-y-4">
              {loading ? (
                <LoadingSkeleton count={3} height="h-24" />
              ) : exercises.length === 0 ? (
                <div className="text-center py-6 text-slate-400">
                  No exercise catalog found. Make sure seeds are loaded.
                </div>
              ) : (
                exercises.map((ex) => (
                  <div
                    key={ex.id}
                    className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-900/40 rounded-2xl border border-slate-200/20 gap-4"
                  >
                    <div className="flex items-start space-x-4">
                      <img
                        src={ex.image}
                        alt={ex.name}
                        className="w-16 h-16 object-cover rounded-xl shadow-sm flex-shrink-0"
                      />
                      <div className="text-left space-y-1">
                        <span className="inline-block px-2 py-0.5 text-[9px] font-bold bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-full">
                          {ex.category}
                        </span>
                        <h4 className="font-bold text-sm text-slate-800 dark:text-white leading-tight">
                          {ex.name}
                        </h4>
                        <p className="text-xs text-slate-400 leading-snug">
                          {ex.benefits}
                        </p>
                        <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-bold uppercase">
                          <span>⏱️ {ex.durationMinutes} Mins</span>
                          <span>•</span>
                          <span>📶 {ex.difficulty}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 w-full md:w-auto">
                      <a
                        href={ex.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-secondary py-2 px-3.5 text-xs rounded-xl flex items-center space-x-1.5 w-full md:w-auto justify-center"
                      >
                        <FaExternalLinkAlt className="text-[10px]" />
                        <span>Watch Video</span>
                      </a>
                      <button
                        onClick={() => handleStartWorkout(ex)}
                        className="btn-primary py-2 px-4 text-xs rounded-xl flex items-center space-x-1.5 w-full md:w-auto justify-center"
                      >
                        <FaPlay className="text-[10px]" />
                        <span>Start Workout</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassCard>

          {/* Exercise Logs History */}
          <GlassCard>
            <h3 className="font-bold text-sm mb-4 flex items-center space-x-2">
              <FaCalendarCheck className="text-primary-500 text-sm" />
              <span>Exercise Log History</span>
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/50 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Workout Name</th>
                    <th className="py-2.5 px-3">Duration</th>
                    <th className="py-2.5 px-3">Reps</th>
                    <th className="py-2.5 px-3 text-right">Calories Burned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-3"><LoadingSkeleton count={2} height="h-8" /></td>
                    </tr>
                  ) : exerciseLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400">
                        No workouts logged yet. Start a routine to track physical logs!
                      </td>
                    </tr>
                  ) : (
                    exerciseLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                        <td className="py-2.5 px-3 font-semibold text-slate-500">
                          {new Date(log.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-700 dark:text-slate-300">{log.name}</td>
                        <td className="py-2.5 px-3 font-medium">{log.durationMinutes} mins</td>
                        <td className="py-2.5 px-3">{log.repsCompleted || '—'}</td>
                        <td className="py-2.5 px-3 font-bold text-emerald-500 text-right">-{log.caloriesBurned} kcal</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>

        {/* Right column: Interactive Tracker panel */}
        <div className="space-y-6">
          <GlassCard className="h-full">
            <h3 className="font-bold text-sm mb-4 flex items-center space-x-2 text-primary-500">
              <FaRunning />
              <span>Interactive Active Tracker</span>
            </h3>

            {!activeExercise ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-xs text-slate-400 dark:text-slate-500 space-y-3">
                <FaInfoCircle className="text-3xl" />
                <p>No workout currently active.</p>
                <p className="max-w-[200px]">Click "Start Workout" on any plan to initialize the countdown tracker and rep logger.</p>
              </div>
            ) : (
              <div className="space-y-6 text-center">
                
                {/* Active Info */}
                <div className="space-y-1">
                  <span className="inline-block px-2.5 py-0.5 text-[9px] font-bold bg-primary-500/10 text-primary-500 rounded-full uppercase">
                    Active Session
                  </span>
                  <h4 className="font-bold text-base text-slate-800 dark:text-white leading-tight">
                    {activeExercise.name}
                  </h4>
                  <p className="text-[11px] text-slate-400">{activeExercise.category}</p>
                </div>

                {/* Countdown Timer Circle */}
                <div className="flex flex-col items-center justify-center p-6 bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/20 rounded-2xl">
                  <FaClock className="text-primary-500 text-xl mb-2" />
                  <span className="text-4xl font-black font-mono tracking-wider text-slate-800 dark:text-white">
                    {formatTime(timeLeft)}
                  </span>
                  
                  {/* Control Buttons */}
                  <div className="flex items-center space-x-3 mt-4">
                    <button
                      onClick={handleToggleTimer}
                      className="p-2 bg-white dark:bg-slate-800 rounded-xl hover:bg-slate-100 shadow-sm border border-slate-200/20"
                    >
                      {timerRunning ? <FaPause className="text-xs" /> : <FaPlay className="text-xs" />}
                    </button>
                    <button
                      onClick={handleResetTimer}
                      className="p-2 bg-white dark:bg-slate-800 rounded-xl hover:bg-slate-100 shadow-sm border border-slate-200/20"
                    >
                      <FaRedo className="text-xs" />
                    </button>
                  </div>
                </div>

                {/* Reps Counter clicker */}
                <div className="space-y-3">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Repetitions Completed
                  </span>
                  <div className="flex items-center justify-center space-x-6">
                    <button
                      onClick={() => setReps(prev => Math.max(0, prev - 1))}
                      className="w-8 h-8 rounded-full border border-slate-200/50 dark:border-slate-800 flex items-center justify-center hover:bg-slate-100 font-bold"
                    >
                      -
                    </button>
                    <span className="text-3xl font-black font-mono w-16 text-center">{reps}</span>
                    <button
                      onClick={handleAddRep}
                      className="w-10 h-10 rounded-full bg-primary-500 text-white flex items-center justify-center hover:bg-primary-600 font-bold shadow-md shadow-primary-500/10"
                    >
                      <FaPlus className="text-xs" />
                    </button>
                  </div>
                </div>

                {/* Steps Details */}
                <div className="text-left border-t border-slate-100 dark:border-slate-800/60 pt-4 space-y-2">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">
                    Workout Steps
                  </span>
                  <ol className="list-decimal list-inside text-xs leading-relaxed text-slate-500 dark:text-slate-400 space-y-1.5 pl-1.5">
                    {activeExercise.steps.slice(0, 3).map((step, idx) => (
                      <li key={idx} className="truncate">{step}</li>
                    ))}
                  </ol>
                </div>

                {/* Log button */}
                <button
                  onClick={handleLogWorkout}
                  disabled={loggingState}
                  className="btn-primary w-full py-3 rounded-xl font-bold mt-4 flex items-center justify-center space-x-2"
                >
                  {loggingState ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <span>Log Workout Completed</span>
                  )}
                </button>
              </div>
            )}
          </GlassCard>
        </div>

      </div>

    </div>
  );
};

export default Exercise;
