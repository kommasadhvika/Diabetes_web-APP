import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FaSun, FaMoon, FaBell, FaBars, FaUser, FaSignOutAlt, FaCircle, FaCog } from 'react-icons/fa';
import API from '../utils/api';


const Navbar = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Fetch unread notifications
  const loadNotifications = async () => {
    try {
      const res = await API.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications in navbar:', error.message);
    }
  };

  useEffect(() => {
    if (user) {
      loadNotifications();
      // Poll every 30 seconds for new alerts
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Click outside listener to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (error) {
      console.error(error.message);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between w-full px-6 py-4 bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl border-b border-slate-200/40 dark:border-slate-800/20">
      
      {/* Left side: Hamburger and title */}
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleSidebar}
          className="p-2 text-slate-500 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none lg:hidden"
        >
          <FaBars className="text-xl" />
        </button>
        <h1 className="text-lg font-bold text-slate-800 dark:text-white capitalize">
          Welcome back, {user ? user.name.split(' ')[0] : 'User'}
        </h1>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center space-x-3 lg:space-x-4">
        
        {/* Dark/Light mode toggle */}
        <button
          onClick={toggleTheme}
          className="p-2.5 text-slate-500 hover:text-primary-500 dark:text-slate-400 dark:hover:text-primary-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <FaSun className="text-lg" /> : <FaMoon className="text-lg" />}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 text-slate-500 hover:text-primary-500 dark:text-slate-400 dark:hover:text-primary-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <FaBell className="text-lg" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center w-5 h-5 text-[10px] font-extrabold text-white bg-rose-500 rounded-full border border-white dark:border-slate-900">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 w-80 mt-3 origin-top-right bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800 shadow-xl overflow-hidden z-50">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200/50 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                <span className="font-bold text-sm text-slate-800 dark:text-white">Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-xs font-semibold text-primary-500 bg-primary-500/10 px-2.5 py-0.5 rounded-full">
                    {unreadCount} New
                  </span>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 dark:text-slate-500">
                    No new alerts or reminders.
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleMarkAsRead(notif.id)}
                      className={`p-4 text-left cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                        !notif.read ? 'bg-primary-500/5 dark:bg-primary-500/5' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between space-x-2">
                        <p className={`text-xs font-semibold ${!notif.read ? 'text-slate-800 dark:text-white' : 'text-slate-500'}`}>
                          {notif.title}
                        </p>
                        {!notif.read && <FaCircle className="text-[7px] text-primary-500 mt-1" />}
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                        {notif.message}
                      </p>
                      <span className="block mt-1.5 text-[9px] text-slate-400">
                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
              <div className="border-t border-slate-200/50 dark:border-slate-800 text-center">
                <Link
                  to="/notifications"
                  onClick={() => setShowNotifications(false)}
                  className="block py-2.5 text-xs font-bold text-primary-500 hover:text-primary-600 transition-colors"
                >
                  View All Alerts
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Profile Menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-emerald-500 text-white font-bold text-sm shadow-sm">
              {user ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 w-48 mt-3 origin-top-right bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800 shadow-xl z-50 py-1 overflow-hidden">
              <div className="px-4 py-2 border-b border-slate-200/50 dark:border-slate-800">
                <p className="text-xs font-semibold text-slate-400">Signed in as</p>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => { setShowProfileMenu(false); navigate('/profile'); }}
                className="flex items-center space-x-2 w-full text-left px-4 py-2.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <FaUser className="text-slate-400" />
                <span>My Profile</span>
              </button>
              <button
                onClick={() => { setShowProfileMenu(false); navigate('/settings'); }}
                className="flex items-center space-x-2 w-full text-left px-4 py-2.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <FaCog className="text-slate-400" />
                <span>Account Settings</span>
              </button>
              <button
                onClick={() => { setShowProfileMenu(false); logout(); }}
                className="flex items-center space-x-2 w-full text-left px-4 py-2.5 text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors border-t border-slate-200/50 dark:border-slate-800"
              >
                <FaSignOutAlt />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
