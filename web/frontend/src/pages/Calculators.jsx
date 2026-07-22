import React, { useState, useEffect } from 'react';
import GlassCard from '../components/GlassCard';
import API from '../utils/api';
import { FaCalculator, FaWeight, FaFire, FaTint, FaHeartbeat } from 'react-icons/fa';

const Calculators = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [weight, setWeight] = useState(70);
  const [height, setHeight] = useState(170);
  const [age, setAge] = useState(35);
  const [gender, setGender] = useState('Male');
  const [activityLevel, setActivityLevel] = useState('Sedentary');
  const [avgGlucose, setAvgGlucose] = useState(120);

  // Fetch profile to pre-fill calculations
  useEffect(() => {
    const fetchProfileAndSugar = async () => {
      try {
        const profileRes = await API.get('/profile');
        if (profileRes.data.success && profileRes.data.profile) {
          const prof = profileRes.data.profile;
          setProfile(prof);
          setWeight(prof.weight || 70);
          setHeight(prof.height || 170);
          setAge(prof.age || 35);
          setGender(prof.gender || 'Male');
          setActivityLevel(prof.activityLevel || 'Sedentary');
        }

        // Fetch sugar history to estimate average glucose
        const sugarRes = await API.get('/sugar');
        if (sugarRes.data.success && sugarRes.data.readings?.length > 0) {
          const readings = sugarRes.data.readings;
          const avg = Math.round(readings.reduce((sum, r) => sum + r.value, 0) / readings.length);
          setAvgGlucose(avg);
        }
      } catch (err) {
        console.error('Error fetching clinical stats:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndSugar();
  }, []);

  // 1. BMI Calculation
  const heightInMeters = height / 100;
  const bmi = heightInMeters > 0 ? (weight / (heightInMeters * heightInMeters)).toFixed(1) : 0;
  const getBmiCategory = (bmiVal) => {
    if (bmiVal < 18.5) return { label: 'Underweight', color: 'text-blue-500' };
    if (bmiVal < 25) return { label: 'Normal Weight', color: 'text-emerald-500' };
    if (bmiVal < 30) return { label: 'Overweight', color: 'text-amber-500' };
    return { label: 'Obese', color: 'text-rose-500' };
  };
  const bmiCat = getBmiCategory(parseFloat(bmi));

  // 2. BMR Calculation (Mifflin-St Jeor)
  const bmr = gender === 'Male'
    ? Math.round(10 * weight + 6.25 * height - 5 * age + 5)
    : Math.round(10 * weight + 6.25 * height - 5 * age - 161);

  // 3. TDEE (Total Daily Energy Expenditure) calculation
  const getActivityMultiplier = (level) => {
    switch (level) {
      case 'Lightly Active': return 1.375;
      case 'Moderately Active': return 1.55;
      case 'Very Active': return 1.725;
      case 'Sedentary':
      default: return 1.2;
    }
  };
  const tdee = Math.round(bmr * getActivityMultiplier(activityLevel));

  // 4. Diabetes Target Calorie Budget (-500 kcal for safe caloric deficit to improve insulin sensitivity)
  const targetCal = Math.round(tdee - 500);

  // Diabetic Macro Split: 40% Carbs, 30% Protein, 30% Fat
  // Carbs: 4 kcal/g, Protein: 4 kcal/g, Fat: 9 kcal/g
  const carbG = Math.round((targetCal * 0.40) / 4);
  const proteinG = Math.round((targetCal * 0.30) / 4);
  const fatG = Math.round((targetCal * 0.30) / 9);

  // 5. Estimated HbA1c Estimation (ADA eAG formula)
  // HbA1c = (eAG + 46.7) / 28.7
  const hba1c = ((parseFloat(avgGlucose) + 46.7) / 28.7).toFixed(1);
  const getHba1cRisk = (hba1cVal) => {
    if (hba1cVal < 5.7) return { label: 'Normal', color: 'text-emerald-500' };
    if (hba1cVal < 6.5) return { label: 'Prediabetic', color: 'text-amber-500' };
    return { label: 'Diabetic Range', color: 'text-rose-500' };
  };
  const hba1cRisk = getHba1cRisk(parseFloat(hba1c));

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h2 className="text-2xl font-extrabold font-sans">Clinical Health Calculators</h2>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Compute body metrics, estimated glycemic indices, and target metabolic expenditures derived from endocrine parameters.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Parameters input panel */}
        <div className="space-y-6">
          <GlassCard className="text-left">
            <h3 className="font-bold text-sm mb-4 flex items-center space-x-2">
              <FaCalculator className="text-primary-500 text-xs" />
              <span>Biometric Parameters</span>
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 pl-1">
                  Weight (kg)
                </label>
                <input 
                  type="number" 
                  value={weight} 
                  onChange={(e) => setWeight(Math.max(1, parseFloat(e.target.value) || 0))}
                  className="glass-input" 
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 pl-1">
                  Height (cm)
                </label>
                <input 
                  type="number" 
                  value={height} 
                  onChange={(e) => setHeight(Math.max(1, parseFloat(e.target.value) || 0))}
                  className="glass-input" 
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 pl-1">
                  Age (years)
                </label>
                <input 
                  type="number" 
                  value={age} 
                  onChange={(e) => setAge(Math.max(1, parseInt(e.target.value) || 0))}
                  className="glass-input" 
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
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 pl-1">
                  Physical Activity Level
                </label>
                <select 
                  value={activityLevel} 
                  onChange={(e) => setActivityLevel(e.target.value)}
                  className="glass-input"
                >
                  <option value="Sedentary">Sedentary (Little/No Exercise)</option>
                  <option value="Lightly Active">Lightly Active (1-3 days/week)</option>
                  <option value="Moderately Active">Moderately Active (3-5 days/week)</option>
                  <option value="Very Active">Very Active (6-7 days/week)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 pl-1">
                  Average Blood Glucose (mg/dL)
                </label>
                <input 
                  type="number" 
                  value={avgGlucose} 
                  onChange={(e) => setAvgGlucose(Math.max(1, parseFloat(e.target.value) || 0))}
                  className="glass-input" 
                />
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Results grid */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card 1: BMI & BMR */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard className="text-left relative overflow-hidden">
              <FaWeight className="absolute right-4 bottom-4 text-slate-100 dark:text-slate-900/30 text-7xl -z-10" />
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Body Mass Index (BMI)</span>
              <h4 className="text-4xl font-black mb-1">{bmi}</h4>
              <span className={`text-xs font-bold ${bmiCat.color}`}>{bmiCat.label}</span>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-4 leading-relaxed">
                Maintaining a BMI within the 18.5–24.9 window markedly boosts insulin sensitivity and reduces tissue resistance.
              </p>
            </GlassCard>

            <GlassCard className="text-left relative overflow-hidden">
              <FaFire className="absolute right-4 bottom-4 text-slate-100 dark:text-slate-900/30 text-7xl -z-10" />
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Basal Metabolic Rate (BMR)</span>
              <h4 className="text-4xl font-black mb-1">{bmr}</h4>
              <span className="text-xs font-bold text-primary-500">kcal / day (rest energy)</span>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-4 leading-relaxed">
                Your body burns {bmr} calories daily purely at rest to support vital cellular functions, respiration, and blood flow.
              </p>
            </GlassCard>
          </div>

          {/* Card 2: HbA1c Estimate */}
          <GlassCard className="text-left relative overflow-hidden">
            <FaHeartbeat className="absolute right-6 bottom-4 text-slate-100 dark:text-slate-900/20 text-8xl -z-10" />
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Estimated HbA1c Level</span>
            
            <div className="flex flex-wrap items-baseline space-x-2 mt-2">
              <span className="text-5xl font-black">{hba1c}%</span>
              <span className={`text-sm font-extrabold ${hba1cRisk.color}`}>({hba1cRisk.label})</span>
            </div>

            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden mt-4">
              <div 
                className={`h-full transition-all duration-500 ${
                  parseFloat(hba1c) < 5.7 ? 'bg-emerald-500' :
                  parseFloat(hba1c) < 6.5 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(100, (parseFloat(hba1c) / 14) * 100)}%` }}
              ></div>
            </div>

            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-4 leading-relaxed">
              HbA1c represents your average blood glucose concentrations over the past 3 months. 
              <strong> Keep HbA1c below 6.5% </strong> to reduce risks of microvascular, retinal, and neuropathy complications.
            </p>
          </GlassCard>

          {/* Card 3: Calorie target & Macro recommendations */}
          <GlassCard className="text-left">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Target Caloric Intake & Macros Split</span>
            <div className="flex items-baseline space-x-2 mt-2 border-b border-slate-200/30 dark:border-slate-800/30 pb-4">
              <span className="text-4xl font-black text-primary-500">{targetCal}</span>
              <span className="text-xs font-bold text-slate-400">kcal / day (Weight-Control Deficit)</span>
            </div>

            {/* Macros progress charts */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6">
              
              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Carbs (40%)</span>
                  <span className="text-sm font-black text-amber-500">{carbG}g</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full" style={{ width: '40%' }}></div>
                </div>
                <span className="text-[10px] text-slate-400 block">Focus on high fiber complex carbs.</span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Protein (30%)</span>
                  <span className="text-sm font-black text-emerald-500">{proteinG}g</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full" style={{ width: '30%' }}></div>
                </div>
                <span className="text-[10px] text-slate-400 block">Supports lean mass and fullness.</span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Fats (30%)</span>
                  <span className="text-sm font-black text-blue-500">{fatG}g</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full" style={{ width: '30%' }}></div>
                </div>
                <span className="text-[10px] text-slate-400 block">Healthy fats (monounsaturated).</span>
              </div>

            </div>
          </GlassCard>

        </div>

      </div>
    </div>
  );
};

export default Calculators;
