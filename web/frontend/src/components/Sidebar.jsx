import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FaHome, FaHeartbeat, FaAppleAlt, FaRunning, 
  FaCalendarAlt, FaTint, FaUserMd, FaChartBar, 
  FaBell, FaCog, FaInfoCircle, FaEnvelope, 
  FaUser, FaSignOutAlt, FaRobot, FaCamera,
  FaCalculator, FaTrophy
} from 'react-icons/fa';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { logout, user } = useAuth();

  const links = [
    { name: 'Dashboard', path: '/dashboard', icon: FaHome },
    { name: 'Sugar Tracking', path: '/sugar-tracking', icon: FaHeartbeat },
    { name: 'Diet Plan', path: '/diet-plan', icon: FaAppleAlt },
    { name: 'Exercise Plan', path: '/exercise', icon: FaRunning },
    { name: 'Daily Scheduler', path: '/scheduler', icon: FaCalendarAlt },
    { name: 'Water Tracker', path: '/water-tracker', icon: FaTint },
    { name: 'AI Chatbot', path: '/chatbot', icon: FaRobot },
    { name: 'AI Food Scanner', path: '/food-scanner', icon: FaCamera },
    { name: 'Health Calculators', path: '/calculators', icon: FaCalculator },
    { name: 'Gamification & Streaks', path: '/gamification', icon: FaTrophy },
    { name: 'Doctor Visit', path: '/appointments', icon: FaUserMd },
    { name: 'Analytics', path: '/analytics', icon: FaChartBar },
    { name: 'Notifications', path: '/notifications', icon: FaBell },
    { name: 'Settings', path: '/settings', icon: FaCog },
    { name: 'About App', path: '/about', icon: FaInfoCircle },
    { name: 'Contact Support', path: '/contact', icon: FaEnvelope },
  ];

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 bg-white/80 dark:bg-slate-950/80 border-r border-slate-200/50 dark:border-slate-800/40 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/40 dark:border-slate-800/20">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-gradient-to-tr from-primary-500 to-emerald-600 rounded-xl text-white shadow-md shadow-primary-500/20">
              <FaHeartbeat className="text-xl" />
            </div>
            <span className="font-extrabold text-lg bg-gradient-to-r from-primary-600 to-emerald-500 bg-clip-text text-transparent">
              DiaPredict AI
            </span>
          </div>
          <button 
            onClick={toggleSidebar}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 lg:hidden"
          >
            &times;
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5 scrollbar-thin">
          {links.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              onClick={() => { if(window.innerWidth < 1024) toggleSidebar(); }}
              className={({ isActive }) =>
                `flex items-center space-x-3.5 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-primary-500/10 to-emerald-500/5 text-primary-600 dark:text-primary-400 border-l-4 border-primary-500'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-900/40 hover:text-slate-900 dark:hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <link.icon className={`text-lg transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? 'text-primary-500' : 'text-slate-400 dark:text-slate-500'
                  }`} />
                  <span>{link.name}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-slate-200/40 dark:border-slate-800/20">
          {user && (
            <NavLink
              to="/profile"
              onClick={() => { if(window.innerWidth < 1024) toggleSidebar(); }}
              className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-100/50 dark:hover:bg-slate-900/40 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-emerald-500 text-white font-bold shadow-sm">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                    {user.name}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-[120px]">
                    {user.email}
                  </p>
                </div>
              </div>
              <FaUser className="text-slate-400 hover:text-primary-500" />
            </NavLink>
          )}
          <button
            onClick={logout}
            className="flex items-center justify-center w-full mt-4 space-x-2 py-2 px-4 rounded-xl text-sm font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all border border-transparent hover:border-rose-200 dark:hover:border-rose-900/40"
          >
            <FaSignOutAlt />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
