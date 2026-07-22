import React, { useState, useEffect } from 'react';
import GlassCard from '../components/GlassCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import API from '../utils/api';
import { FaUserMd, FaHospital, FaCalendarAlt, FaClock, FaClipboard, FaPlus, FaTrashAlt, FaCheck, FaInfoCircle } from 'react-icons/fa';

const DoctorAppointment = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [doctorName, setDoctorName] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const loadAppointments = async () => {
    try {
      const res = await API.get('/appointments');
      if (res.data.success) {
        setAppointments(res.data.appointments);
      }
    } catch (err) {
      console.error('Error fetching appointments:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setFormLoading(true);

    if (!doctorName || !hospitalName || !date || !time) {
      setFormError('Please fill in all details');
      setFormLoading(false);
      return;
    }

    try {
      const res = await API.post('/appointments', {
        doctorName,
        hospitalName,
        date,
        time,
        notes
      });

      if (res.data.success) {
        setFormSuccess('Doctor check-up scheduled successfully!');
        setDoctorName('');
        setHospitalName('');
        setDate('');
        setTime('');
        setNotes('');
        loadAppointments();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error scheduling appointment');
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleCompleted = async (id, currentVal) => {
    try {
      const res = await API.put(`/appointments/${id}`, { completed: !currentVal });
      if (res.data.success) {
        setAppointments(prev => prev.map(a => a.id === id ? { ...a, completed: !currentVal } : a));
      }
    } catch (err) {
      console.error('Error updating appointment:', err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this scheduled checkup?')) return;
    try {
      const res = await API.delete(`/appointments/${id}`);
      if (res.data.success) {
        setAppointments(prev => prev.filter(a => a.id !== id));
      }
    } catch (err) {
      console.error('Error deleting appointment:', err.message);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h2 className="text-2xl font-extrabold font-sans">Doctor Appointments</h2>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Organize clinic consultations, physician checkups, and save clinical logs.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Add Appointment */}
        <div>
          <GlassCard>
            <h3 className="font-bold text-sm mb-4 flex items-center space-x-2">
              <FaPlus className="text-primary-500 text-xs" />
              <span>Schedule Checkup</span>
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
              {/* Doctor Name */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 pl-1">
                  Doctor Name
                </label>
                <div className="relative">
                  <FaUserMd className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                  <input
                    type="text"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    placeholder="e.g. Dr. Sarah Connor"
                    className="glass-input pl-11"
                    required
                  />
                </div>
              </div>

              {/* Hospital */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 pl-1">
                  Hospital Name
                </label>
                <div className="relative">
                  <FaHospital className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                  <input
                    type="text"
                    value={hospitalName}
                    onChange={(e) => setHospitalName(e.target.value)}
                    placeholder="e.g. City General Hospital"
                    className="glass-input pl-11"
                    required
                  />
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 pl-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="glass-input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 pl-1">
                    Time (24h)
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="glass-input"
                    required
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 pl-1">
                  Consultation Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Discuss HbA1c lab report and insulin dose adjustments."
                  rows={3}
                  className="glass-input resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="btn-primary w-full py-2.5 rounded-xl font-bold flex items-center justify-center space-x-2"
              >
                {formLoading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <span>Schedule Consultation</span>
                )}
              </button>
            </form>
          </GlassCard>
        </div>

        {/* Right column: List of checkups */}
        <div className="lg:col-span-2 space-y-6">
          <GlassCard>
            <h3 className="font-bold text-sm mb-4">Upcoming & Past Appointments</h3>

            {loading ? (
              <LoadingSkeleton count={3} height="h-24" />
            ) : appointments.length === 0 ? (
              <div className="text-center py-12 text-slate-400 flex flex-col items-center justify-center space-y-2">
                <FaInfoCircle className="text-2xl" />
                <p>No appointments recorded.</p>
                <p className="text-[10px] max-w-[200px]">Use the clinic entry board to log doctor consult dates.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {appointments.map((appoint) => (
                  <div
                    key={appoint.id}
                    className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 shadow-sm relative overflow-hidden transition-all ${
                      appoint.completed 
                        ? 'bg-slate-100/50 dark:bg-slate-900/30 border-slate-200/50 dark:border-slate-800/60 opacity-60' 
                        : 'bg-white dark:bg-slate-900/40 border-slate-200/35 dark:border-slate-800/40'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="text-left space-y-1">
                        <span className="inline-flex items-center space-x-1.5 text-[10px] font-bold text-primary-500 uppercase">
                          <FaUserMd />
                          <span>Dr. {appoint.doctorName}</span>
                        </span>
                        <h4 className="font-extrabold text-sm text-slate-800 dark:text-white leading-tight">
                          {appoint.hospitalName}
                        </h4>
                      </div>
                      
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => handleToggleCompleted(appoint.id, appoint.completed)}
                          className={`p-1.5 rounded-lg border transition-all ${
                            appoint.completed 
                              ? 'bg-emerald-500 border-emerald-500 text-white' 
                              : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:text-emerald-500'
                          }`}
                          title={appoint.completed ? "Mark Incomplete" : "Mark Completed"}
                        >
                          <FaCheck className="text-[10px]" />
                        </button>
                        <button
                          onClick={() => handleDelete(appoint.id)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-rose-500"
                          title="Cancel/Delete"
                        >
                          <FaTrashAlt className="text-[10px]" />
                        </button>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="flex items-center space-x-4 text-xs font-semibold text-slate-500">
                      <div className="flex items-center space-x-1">
                        <FaCalendarAlt className="text-slate-400" />
                        <span>{appoint.date}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FaClock className="text-slate-400" />
                        <span>{appoint.time}</span>
                      </div>
                    </div>

                    {/* Notes */}
                    {appoint.notes && (
                      <div className="p-3 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/20 rounded-xl text-left flex items-start space-x-2 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        <FaClipboard className="mt-0.5 text-slate-400 flex-shrink-0" />
                        <span>{appoint.notes}</span>
                      </div>
                    )}

                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>

      </div>

    </div>
  );
};

export default DoctorAppointment;
