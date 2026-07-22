import React, { useState, useEffect } from 'react';
import GlassCard from '../components/GlassCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import API from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHeartbeat, FaPlus, FaTrashAlt, FaInfoCircle, FaCalendarAlt } from 'react-icons/fa';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
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
  Title,
  Tooltip,
  Legend,
  Filler
);

const SugarTracking = () => {
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [type, setType] = useState('fasting');
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const loadHistory = async () => {
    try {
      const res = await API.get('/sugar');
      if (res.data.success) {
        setReadings(res.data.readings);
      }
    } catch (err) {
      console.error('Error fetching sugar logs:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setFormLoading(true);

    const val = parseFloat(value);
    if (!value || isNaN(val) || val <= 0) {
      setFormError('Please enter a valid sugar level reading');
      setFormLoading(false);
      return;
    }

    try {
      const res = await API.post('/sugar', { type, value: val, notes });
      if (res.data.success) {
        setFormSuccess('Sugar level recorded successfully!');
        setValue('');
        setNotes('');
        loadHistory();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error recording sugar levels');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this log?')) return;
    try {
      const res = await API.delete(`/sugar/${id}`);
      if (res.data.success) {
        setReadings(prev => prev.filter(r => r.id !== id));
      }
    } catch (err) {
      console.error('Error deleting record:', err.message);
    }
  };

  // Get status class/colors
  const getStatusDetails = (classification) => {
    switch (classification) {
      case 'NORMAL':
        return {
          bg: 'from-emerald-400 to-teal-500 text-white shadow-emerald-500/10',
          text: 'text-emerald-500',
          desc: 'Excellent! Your blood sugar level is within standard range.'
        };
      case 'PREDIABETIC':
        return {
          bg: 'from-amber-400 to-orange-500 text-white shadow-amber-500/10',
          text: 'text-amber-500',
          desc: 'Caution: Your levels indicate Prediabetes. Focus on physical activity and reduce carbs.'
        };
      case 'HIGH DIABETES RISK':
        return {
          bg: 'from-rose-400 to-red-500 text-white shadow-rose-500/10',
          text: 'text-rose-500',
          desc: 'High Risk: Elevated glucose levels. Limit carbs, hydrate, and consider doctor consult.'
        };
      default:
        return {
          bg: 'from-slate-400 to-slate-500 text-white shadow-slate-500/10',
          text: 'text-slate-500',
          desc: 'Enter log details to calculate classifications.'
        };
    }
  };

  // Chart configuration
  const chartData = (() => {
    // Reverse logs to show oldest-to-newest chronological trend
    const sorted = [...readings].slice(0, 10).reverse();
    return {
      labels: sorted.map(r => new Date(r.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })),
      datasets: [
        {
          label: 'Glucose Level (mg/dL)',
          data: sorted.map(r => r.value),
          borderColor: '#10b981', // primary green
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.3,
          pointBackgroundColor: '#10b981',
          pointHoverRadius: 7
        }
      ]
    };
  })();

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.raw} mg/dL`
        }
      }
    },
    scales: {
      y: {
        grid: { color: 'rgba(148, 163, 184, 0.1)' },
        ticks: { font: { family: 'Inter' } }
      },
      x: {
        grid: { display: false },
        ticks: { font: { family: 'Inter' } }
      }
    }
  };

  const latestReading = readings.length > 0 ? readings[0] : null;
  const status = latestReading ? getStatusDetails(latestReading.classification) : getStatusDetails('');

  return (
    <div className="space-y-6">
      
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold">Sugar Level Tracking</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Log and review your daily fasting, post-meal, and random blood sugar values.
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Add Reading Form */}
        <div className="space-y-6">
          <GlassCard>
            <h3 className="text-base font-bold mb-4 flex items-center space-x-2">
              <FaPlus className="text-primary-500 text-xs" />
              <span>Log New Reading</span>
            </h3>

            {formError && (
              <div className="p-3 mb-4 text-xs font-semibold text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                {formError}
              </div>
            )}
            {formSuccess && (
              <div className="p-3 mb-4 text-xs font-semibold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                {formSuccess}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              {/* Type selector */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 pl-1">
                  Test Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="glass-input"
                >
                  <option value="fasting">Fasting Glucose (Morning)</option>
                  <option value="afterMeal">After Meal Glucose</option>
                  <option value="random">Random Glucose</option>
                </select>
              </div>

              {/* Value input */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 pl-1">
                  Glucose Value (mg/dL)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="e.g. 105"
                    className="glass-input"
                    required
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                    mg/dL
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 pl-1">
                  Optional Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Ate sweet snacks yesterday evening"
                  rows={3}
                  className="glass-input resize-none"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={formLoading}
                className="btn-primary w-full py-2.5 rounded-xl font-bold flex items-center justify-center space-x-2"
              >
                {formLoading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <span>Record Reading</span>
                )}
              </button>
            </form>
          </GlassCard>

          {/* Classification animated status card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={latestReading ? latestReading.id : 'empty'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <GlassCard className={`bg-gradient-to-tr ${status.bg} shadow-lg`}>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold tracking-widest uppercase opacity-75">
                      LATEST STATUS
                    </span>
                    <h4 className="text-xl font-extrabold tracking-tight">
                      {latestReading ? latestReading.classification : 'No Logs Yet'}
                    </h4>
                  </div>
                  <div className="p-2.5 bg-white/20 rounded-xl text-white">
                    <FaHeartbeat className="text-xl" />
                  </div>
                </div>

                {latestReading && (
                  <div className="mt-4 flex items-baseline space-x-2">
                    <span className="text-3xl font-extrabold">{latestReading.value}</span>
                    <span className="text-xs font-bold opacity-85">mg/dL ({latestReading.type})</span>
                  </div>
                )}

                <p className="mt-4 text-xs font-semibold leading-relaxed opacity-90">
                  {status.desc}
                </p>
              </GlassCard>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right column: Trends Chart and logs */}
        <div className="lg:col-span-2 space-y-6">
          {/* History Chart */}
          <GlassCard>
            <h3 className="text-base font-bold mb-4 flex items-center space-x-2">
              <FaCalendarAlt className="text-primary-500 text-xs" />
              <span>Blood Glucose Trend (Last 10 Logs)</span>
            </h3>
            <div className="h-64">
              {loading ? (
                <LoadingSkeleton count={4} height="h-12" />
              ) : readings.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-sm text-slate-400 dark:text-slate-500">
                  <FaInfoCircle className="text-lg mb-2" />
                  <span>Log blood sugar readings to visualize your glucose curves.</span>
                </div>
              ) : (
                <Line data={chartData} options={chartOptions} />
              )}
            </div>
          </GlassCard>

          {/* History Table logs */}
          <GlassCard>
            <h3 className="text-base font-bold mb-4">Reading History Log</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/50 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Glucose</th>
                    <th className="py-3 px-4">Class</th>
                    <th className="py-3 px-4">Notes</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-4">
                        <LoadingSkeleton count={3} height="h-8" />
                      </td>
                    </tr>
                  ) : readings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400 dark:text-slate-500">
                        No logs recorded yet. Use the log panel to register your first sugar check.
                      </td>
                    </tr>
                  ) : (
                    readings.map((reading) => {
                      const details = getStatusDetails(reading.classification);
                      return (
                        <tr key={reading.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                          <td className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">
                            {new Date(reading.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-3 px-4 capitalize font-medium">{reading.type}</td>
                          <td className="py-3 px-4 font-extrabold text-sm">{reading.value} mg/dL</td>
                          <td className="py-3 px-4">
                            <span className={`inline-block px-2.5 py-0.5 font-bold rounded-full text-[10px] ${details.text} bg-slate-100 dark:bg-slate-800`}>
                              {reading.classification}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-400 max-w-[150px] truncate" title={reading.notes}>
                            {reading.notes || '—'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleDelete(reading.id)}
                              className="p-1.5 rounded-lg text-rose-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                            >
                              <FaTrashAlt />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>

      </div>
    </div>
  );
};

export default SugarTracking;
