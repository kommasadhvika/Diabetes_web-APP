import React, { useState, useEffect } from 'react';
import GlassCard from '../components/GlassCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import API from '../utils/api';
import { FaCalendarAlt, FaCheckCircle, FaRegCircle, FaEdit, FaSave, FaPlus, FaTrashAlt } from 'react-icons/fa';

const DailyScheduler = () => {
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [events, setEvents] = useState([]);
  const [saveLoading, setSaveLoading] = useState(false);
  const [lastAlarmedTime, setLastAlarmedTime] = useState('');

  const loadSchedule = async () => {
    try {
      const res = await API.get('/schedule');
      if (res.data.success) {
        setSchedule(res.data.schedule);
        setEvents(res.data.schedule.events);
      }
    } catch (err) {
      console.error('Error fetching scheduler info:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedule();
  }, []);

  // Helpers for Web Audio Alarms
  const getCurrentFormattedTime = () => {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const strHours = hours < 10 ? '0' + hours : hours;
    const strMinutes = minutes < 10 ? '0' + minutes : minutes;
    return `${strHours}:${strMinutes} ${ampm}`;
  };

  const normalizeTime = (timeStr) => {
    if (!timeStr) return '';
    return timeStr.trim().toLowerCase().replace(/^0/, '');
  };

  const playAlarmSound = () => {
    if (typeof window === 'undefined') return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const playBeep = (timeOffset) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.4, audioCtx.currentTime + timeOffset);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + timeOffset + 0.35);
        osc.start(audioCtx.currentTime + timeOffset);
        osc.stop(audioCtx.currentTime + timeOffset + 0.4);
      };
      playBeep(0);
      playBeep(0.45);
      playBeep(0.9);
    } catch (err) {
      console.error('Web Audio Synth failed:', err.message);
    }
  };

  useEffect(() => {
    const checkAlarms = () => {
      const currentTime = getCurrentFormattedTime();
      if (currentTime === lastAlarmedTime) return;

      const normalizedCurrent = normalizeTime(currentTime);
      const matchingEvent = events.find(e => 
        e.status === 'pending' && 
        normalizeTime(e.time) === normalizedCurrent
      );

      if (matchingEvent) {
        console.log('[ALARM TRIGGERED] Event:', matchingEvent.title);
        playAlarmSound();
        setLastAlarmedTime(currentTime);
        
        // Show non-blocking system alert banner overlay
        setTimeout(() => {
          alert(`⏰ HEALTH REMINDER:\n\nIt is time to track or complete your task: "${matchingEvent.title}" (scheduled for ${matchingEvent.time}).`);
        }, 100);
      }
    };

    const intervalId = setInterval(checkAlarms, 10000); // check every 10 seconds
    return () => clearInterval(intervalId);
  }, [events, lastAlarmedTime]);

  const handleToggleEvent = async (eventId) => {
    // Optimistic UI update
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, status: e.status === 'completed' ? 'pending' : 'completed' } : e));
    try {
      await API.put(`/schedule/toggle/${eventId}`);
    } catch (err) {
      console.error('Toggle failed, reloading:', err.message);
      loadSchedule(); // rollback
    }
  };

  const handleEventTimeChange = (id, newTime) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, time: newTime } : e));
  };

  const handleEventTitleChange = (id, newTitle) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, title: newTitle } : e));
  };

  const handleSaveSchedule = async () => {
    setSaveLoading(true);
    try {
      const res = await API.put('/schedule', { events });
      if (res.data.success) {
        setSchedule(res.data.schedule);
        setEditMode(false);
        alert('Daily schedule timings updated successfully!');
      }
    } catch (err) {
      console.error('Error saving schedule timings:', err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleAddEvent = () => {
    const newId = Math.random().toString(36).substring(2, 9);
    setEvents(prev => [
      ...prev,
      { id: newId, title: 'New Task', time: '12:00 PM', type: 'meal', status: 'pending' }
    ]);
  };

  const handleDeleteEvent = (id) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const handleEventChangeType = (id, type) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, type } : e));
  };

  // Status colors based on event type
  const getTypeStyles = (type) => {
    switch (type) {
      case 'meal':
        return 'border-emerald-500 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400';
      case 'exercise':
        return 'border-orange-500 bg-orange-500/5 text-orange-600 dark:text-orange-400';
      case 'water':
        return 'border-blue-500 bg-blue-500/5 text-blue-600 dark:text-blue-400';
      case 'check':
        return 'border-pink-500 bg-pink-500/5 text-pink-600 dark:text-pink-400';
      default:
        return 'border-slate-500 bg-slate-500/5 text-slate-600 dark:text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold font-sans">Daily Health Scheduler</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Monitor and coordinate target slots for tracking glucose, nutritional meals, physical exercises, and water intervals.
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {editMode ? (
            <>
              <button
                onClick={handleAddEvent}
                className="btn-secondary py-2 px-4 text-xs font-bold flex items-center space-x-1.5"
              >
                <FaPlus />
                <span>Add Slot</span>
              </button>
              <button
                onClick={handleSaveSchedule}
                disabled={saveLoading}
                className="btn-primary py-2 px-5 text-xs font-bold flex items-center space-x-1.5"
              >
                <FaSave />
                <span>{saveLoading ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditMode(true)}
              className="btn-secondary py-2 px-5 text-xs font-bold flex items-center space-x-1.5"
            >
              <FaEdit />
              <span>Modify Times</span>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton count={4} height="h-16" />
      ) : (
        <div className="max-w-3xl mx-auto space-y-4">
          <GlassCard>
            <h3 className="font-bold text-sm mb-6 flex items-center space-x-2">
              <FaCalendarAlt className="text-primary-500 text-xs" />
              <span>Timeline Scheduler List</span>
            </h3>

            <div className="relative border-l-2 border-slate-200/50 dark:border-slate-800/80 pl-6 space-y-6 ml-4">
              
              {events.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-left">No schedule times declared. Edit to configure.</p>
              ) : (
                events.map((event) => {
                  const styles = getTypeStyles(event.type);
                  const isCompleted = event.status === 'completed';
                  
                  return (
                    <div key={event.id} className="relative text-left">
                      {/* Timeline dot */}
                      <span className="absolute -left-[33px] top-1.5 flex items-center justify-center w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-800 border-2 border-white dark:border-slate-950">
                        <span className={`w-1.5 h-1.5 rounded-full ${isCompleted ? 'bg-primary-500' : 'bg-slate-400'}`} />
                      </span>

                      {/* Event Card */}
                      <div className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border-l-4 ${styles} gap-4 shadow-sm`}>
                        
                        {/* Event details */}
                        <div className="flex-1 flex items-start space-x-3">
                          
                          {/* Checked Checkbox */}
                          {!editMode && (
                            <button
                              onClick={() => handleToggleEvent(event.id)}
                              className="mt-1 transition-transform active:scale-90"
                            >
                              {isCompleted ? (
                                <FaCheckCircle className="text-primary-500 text-lg" />
                              ) : (
                                <FaRegCircle className="text-slate-300 dark:text-slate-600 hover:text-primary-500 text-lg" />
                              )}
                            </button>
                          )}

                          <div className="flex-1 space-y-1">
                            {editMode ? (
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  value={event.title}
                                  onChange={(e) => handleEventTitleChange(event.id, e.target.value)}
                                  className="w-full bg-white/60 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800 rounded-lg px-2.5 py-1 text-xs outline-none"
                                />
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="text"
                                    value={event.time}
                                    onChange={(e) => handleEventTimeChange(event.id, e.target.value)}
                                    className="bg-white/60 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800 rounded-lg px-2 py-0.5 text-[10px] w-20 outline-none text-center"
                                  />
                                  <select
                                    value={event.type}
                                    onChange={(e) => handleEventChangeType(event.id, e.target.value)}
                                    className="bg-white/60 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800 rounded-lg px-2 py-0.5 text-[10px] outline-none"
                                  >
                                    <option value="meal">Meal</option>
                                    <option value="exercise">Exercise</option>
                                    <option value="water">Water</option>
                                    <option value="check">Check-up</option>
                                  </select>
                                </div>
                              </div>
                            ) : (
                              <>
                                <h4 className={`font-bold text-sm leading-snug ${isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-white'}`}>
                                  {event.title}
                                </h4>
                                <span className="inline-block text-[10px] font-bold text-slate-400 dark:text-slate-500">
                                  ⏱️ {event.time}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Edit commands */}
                        {editMode && (
                          <button
                            onClick={() => handleDeleteEvent(event.id)}
                            className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-colors w-fit self-end sm:self-center"
                          >
                            <FaTrashAlt />
                          </button>
                        )}

                        {/* Status pill (view only) */}
                        {!editMode && (
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase w-fit ${
                            isCompleted 
                              ? 'bg-primary-500/10 text-primary-500' 
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                          }`}>
                            {event.status}
                          </span>
                        )}

                      </div>
                    </div>
                  );
                })
              )}

            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default DailyScheduler;
