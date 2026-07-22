import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/GlassCard';
import { FaUser, FaCheck, FaInfoCircle } from 'react-icons/fa';

const UserProfile = ({ forcedSetup = false }) => {
  const { profile, updateProfile, refreshProfile } = useAuth();

  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [diabetesType, setDiabetesType] = useState('Indian-Vegetarian');
  const [activityLevel, setActivityLevel] = useState('Sedentary');
  const [medicalNotes, setMedicalNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load existing profile parameters
  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || '');
      setAge(profile.age || '');
      setGender(profile.gender || 'Male');
      setHeight(profile.height || '');
      setWeight(profile.weight || '');
      setDiabetesType(profile.diabetesType || 'Indian-Vegetarian');
      setActivityLevel(profile.activityLevel || 'Sedentary');
      setMedicalNotes(profile.medicalNotes || '');
    }
  }, [profile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!fullName || !age || !height || !weight) {
      setError('Please fill in name, age, height, and weight.');
      setLoading(false);
      return;
    }

    const res = await updateProfile({
      fullName,
      age: parseInt(age),
      gender,
      height: parseFloat(height),
      weight: parseFloat(weight),
      diabetesType,
      activityLevel,
      medicalNotes
    });

    setLoading(false);

    if (res.success) {
      setSuccess('Clinical profile parameters saved successfully!');
      // Force trigger session refresh
      await refreshProfile();
    } else {
      setError(res.message || 'Error updating profile');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      {!forcedSetup && (
        <div>
          <h2 className="text-2xl font-extrabold font-sans">Clinical Profile Configuration</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Configure your physiological logs to customize AI calorie target limits and exercise calculations.
          </p>
        </div>
      )}

      <div className="max-w-3xl mx-auto">
        <GlassCard>
          <h3 className="font-bold text-sm mb-6 flex items-center space-x-2 text-primary-500">
            <FaUser className="text-sm" />
            <span>Health Demographics Form</span>
          </h3>

          {error && (
            <div className="p-3 mb-6 text-xs font-semibold text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-xl text-left">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 mb-6 text-xs font-semibold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-left">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 text-left">
            
            {/* Full Name */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 pl-1">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                className="glass-input"
                required
              />
            </div>

            {/* Age, Gender */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 pl-1">
                  Age (Years)
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g. 45"
                  className="glass-input"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 pl-1">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="glass-input"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Height, Weight */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 pl-1">
                  Height (cm)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="e.g. 175"
                    className="glass-input"
                    required
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                    cm
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 pl-1">
                  Weight (kg)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="e.g. 78"
                    className="glass-input"
                    required
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                    kg
                  </span>
                </div>
              </div>
            </div>

            {/* Diet Rotation Type, Activity Level */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 pl-1">
                  Diabetes Type & Diet style
                </label>
                <select
                  value={diabetesType}
                  onChange={(e) => setDiabetesType(e.target.value)}
                  className="glass-input"
                >
                  <option value="Indian-Vegetarian">Type 2 - Indian Vegetarian</option>
                  <option value="Indian-Non-Vegetarian">Type 2 - Indian Non-Vegetarian</option>
                  <option value="International-Vegetarian">Type 2 - International Vegetarian</option>
                  <option value="International-Non-Vegetarian">Type 2 - International Non-Vegetarian</option>
                  <option value="Type 1 - Vegetarian">Type 1 - Vegetarian</option>
                  <option value="Prediabetes - Vegetarian">Prediabetes - Vegetarian</option>
                </select>
              </div>
              
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 pl-1">
                  Activity level
                </label>
                <select
                  value={activityLevel}
                  onChange={(e) => setActivityLevel(e.target.value)}
                  className="glass-input"
                >
                  <option value="Sedentary">Sedentary (No Exercise)</option>
                  <option value="Lightly Active">Lightly Active (Walks 1-2 times/wk)</option>
                  <option value="Moderately Active">Moderately Active (Workouts 3-5 times/wk)</option>
                  <option value="Very Active">Very Active (Heavy training daily)</option>
                </select>
              </div>
            </div>

            {/* Medical Notes */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 pl-1">
                Medical Diagnosis & Notes
              </label>
              <textarea
                value={medicalNotes}
                onChange={(e) => setMedicalNotes(e.target.value)}
                placeholder="e.g. Diagnosed with Type 2 diabetes in 2024. Prescribed Metformin 500mg. Focus: low carbs from Indian origin foods."
                rows={4}
                className="glass-input resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 rounded-xl font-bold flex items-center justify-center space-x-2 shadow-lg shadow-primary-500/10"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <FaCheck />
                  <span>Save Profile Parameters</span>
                </>
              )}
            </button>

          </form>
        </GlassCard>
      </div>

    </div>
  );
};

export default UserProfile;
