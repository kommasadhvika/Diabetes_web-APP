import React, { useState, useEffect } from 'react';
import GlassCard from '../components/GlassCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import API from '../utils/api';
import { FaBell, FaTrashAlt, FaCheck, FaExclamationCircle, FaInfoCircle } from 'react-icons/fa';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadNotifications = async () => {
    try {
      const res = await API.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.notifications);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      const res = await API.put(`/notifications/${id}/read`);
      if (res.data.success) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to delete all notification logs?')) return;
    setActionLoading(true);
    try {
      const res = await API.delete('/notifications');
      if (res.data.success) {
        setNotifications([]);
      }
    } catch (err) {
      console.error(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold font-sans">Notification Center</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Review active system alerts, hydration triggers, and doctor check-up schedules.
          </p>
        </div>
        
        {notifications.length > 0 && (
          <button
            onClick={handleClearAll}
            disabled={actionLoading}
            className="btn-secondary py-2 px-4 text-xs font-bold flex items-center space-x-1.5 w-fit self-end sm:self-center"
          >
            <FaTrashAlt className="text-rose-500" />
            <span>Clear All logs</span>
          </button>
        )}
      </div>

      <div className="max-w-3xl mx-auto">
        <GlassCard>
          <h3 className="font-bold text-sm mb-6 flex items-center space-x-2">
            <FaBell className="text-primary-500 text-xs" />
            <span>Alarms Log Ledger</span>
          </h3>

          <div className="space-y-4">
            {loading ? (
              <LoadingSkeleton count={3} height="h-20" />
            ) : notifications.length === 0 ? (
              <div className="text-center py-12 text-slate-400 flex flex-col items-center justify-center space-y-2">
                <FaInfoCircle className="text-2xl" />
                <p>No notifications logs.</p>
                <p className="text-[10px] max-w-[200px]">Alarms like high sugar readings or appointment confirmations appear here.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between text-left gap-4 transition-all ${
                    notif.read 
                      ? 'bg-slate-50/50 dark:bg-slate-900/10 border-slate-200/20 dark:border-slate-800/20 opacity-70' 
                      : 'bg-primary-500/5 dark:bg-primary-500/5 border-primary-500/10'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-2.5 rounded-xl mt-0.5 ${
                      notif.type === 'alert' 
                        ? 'bg-rose-500/10 text-rose-500' 
                        : 'bg-blue-500/10 text-blue-500'
                    }`}>
                      <FaExclamationCircle className="text-base" />
                    </div>
                    
                    <div className="space-y-1">
                      <h4 className={`font-bold text-sm leading-tight ${notif.read ? 'text-slate-700 dark:text-slate-400' : 'text-slate-800 dark:text-white'}`}>
                        {notif.title}
                      </h4>
                      <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-450">
                        {notif.message}
                      </p>
                      <span className="block text-[9px] text-slate-400 font-medium">
                        Logged on: {new Date(notif.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {!notif.read && (
                    <button
                      onClick={() => handleMarkRead(notif.id)}
                      className="btn-secondary py-1.5 px-3 text-[10px] rounded-lg font-bold flex items-center space-x-1.5 self-end sm:self-center"
                    >
                      <FaCheck className="text-primary-500 text-[8px]" />
                      <span>Mark Read</span>
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </GlassCard>
      </div>

    </div>
  );
};

export default Notifications;
