import React, { useState, useEffect } from 'react';
import GlassCard from '../components/GlassCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import API from '../utils/api';
import { FaAppleAlt, FaSyncAlt, FaClipboardList, FaCheckSquare, FaSquare, FaInfoCircle, FaCalendarAlt } from 'react-icons/fa';

const DietPlan = () => {
  const [dietPlan, setDietPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [genLoading, setGenLoading] = useState(false);
  const [activeDay, setActiveDay] = useState('Monday');

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const loadDiet = async () => {
    try {
      const res = await API.get('/diet');
      if (res.data.success) {
        setDietPlan(res.data.dietPlan);
      }
    } catch (err) {
      console.error('Error fetching diet plan:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDiet();
  }, []);

  const handleRegenerate = async () => {
    if (!window.confirm('Do you want to re-generate your diet plan? The current plan will be updated.')) return;
    setGenLoading(true);
    try {
      const res = await API.post('/diet/generate');
      if (res.data.success) {
        setDietPlan(res.data.dietPlan);
      }
    } catch (err) {
      console.error('Error regenerating diet plan:', err.message);
    } finally {
      setGenLoading(false);
    }
  };

  const handleToggleGrocery = async (item) => {
    try {
      const res = await API.put('/diet/grocery', { item });
      if (res.data.success) {
        setDietPlan(prev => ({
          ...prev,
          groceryChecked: res.data.groceryChecked
        }));
      }
    } catch (err) {
      console.error('Error toggling grocery item:', err.message);
    }
  };

  // Get active day meals
  const activeDayMeals = dietPlan?.schedule?.find(d => d.day === activeDay);

  // Default meal type images
  const mealImages = {
    breakfast: 'https://images.unsplash.com/photo-1497534446932-c925b458314e?w=300&auto=format&fit=crop',
    lunch: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&fit=crop',
    snacks: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=300&auto=format&fit=crop',
    dinner: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&auto=format&fit=crop'
  };

  const renderMealCard = (meal, typeLabel, fallbackImage) => {
    if (!meal) return null;
    
    const getImpactBadgeColor = (impact) => {
      switch (impact?.toLowerCase()) {
        case 'low': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400';
        case 'medium': return 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400';
        case 'high': return 'bg-rose-500/10 border-rose-500/20 text-rose-500 dark:text-rose-400';
        default: return 'bg-slate-500/10 border-slate-500/20 text-slate-500';
      }
    };

    return (
      <GlassCard className="flex flex-col justify-between space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-widest text-primary-500 uppercase">
              {typeLabel} ({meal.time || 'Scheduled'})
            </span>
            <span className="text-xs font-bold text-slate-400">
              {meal.calories} kcal
            </span>
          </div>

          <img
            src={meal.imageUrl || fallbackImage}
            alt={meal.name}
            className="w-full h-36 object-cover rounded-xl shadow-sm"
            onError={(e) => {
              e.target.src = fallbackImage;
            }}
          />

          <div className="flex items-start justify-between gap-2">
            <h4 className="font-bold text-sm text-slate-800 dark:text-white leading-tight">
              {meal.name}
            </h4>
            {meal.glycemicImpact && (
              <span className={`px-2 py-0.5 border text-[9px] font-bold rounded-lg uppercase whitespace-nowrap ${getImpactBadgeColor(meal.glycemicImpact)}`}>
                GI: {meal.glycemicImpact}
              </span>
            )}
          </div>

          <div className="flex space-x-3 text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">
            <span>C: {meal.carbs}g</span>
            <span>P: {meal.protein}g</span>
            <span>F: {meal.fat}g</span>
          </div>
        </div>

        {meal.whyRecommended && (
          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed bg-slate-50/50 dark:bg-slate-900/40 p-2.5 rounded-lg border border-slate-200/10 text-left">
            <strong>AI Advice:</strong> {meal.whyRecommended}
          </p>
        )}
      </GlassCard>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold">AI Nutritional Diet Plan</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Personalized low glycemic index meal plans matching your profile metrics.
          </p>
        </div>
        <button
          onClick={handleRegenerate}
          disabled={loading || genLoading}
          className="btn-secondary py-2 px-4 text-xs font-bold flex items-center space-x-2 w-fit"
        >
          <FaSyncAlt className={genLoading ? 'animate-spin' : ''} />
          <span>Regenerate Diet</span>
        </button>
      </div>

      {loading ? (
        <LoadingSkeleton count={4} height="h-20" />
      ) : !dietPlan ? (
        <div className="text-center py-12 glass-panel">
          <FaInfoCircle className="text-3xl text-slate-400 mx-auto mb-3" />
          <p className="text-sm">Error compiling diet logs. Make sure profile info is complete.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Day selection tabs and meals display */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Days Tabs */}
            <div className="flex overflow-x-auto space-x-2 pb-2 scrollbar-thin">
              {days.map(day => (
                <button
                  key={day}
                  onClick={() => setActiveDay(day)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    activeDay === day
                      ? 'bg-primary-500 text-white shadow-md shadow-primary-500/10'
                      : 'bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>

            {/* Meals Cards */}
            {activeDayMeals && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderMealCard(activeDayMeals.breakfast, 'Breakfast', mealImages.breakfast)}
                {renderMealCard(activeDayMeals.lunch, 'Lunch', mealImages.lunch)}
                {renderMealCard(activeDayMeals.snacks, 'Evening Snack', mealImages.snacks)}
                {renderMealCard(activeDayMeals.dinner, 'Dinner', mealImages.dinner)}
              </div>
            )}
          </div>

          {/* Right column: Target info, AI explanations, Grocery list */}
          <div className="space-y-6">
            
            {/* Target Card info */}
            <GlassCard className="space-y-4">
              <h3 className="font-bold text-sm flex items-center space-x-2 text-primary-500">
                <FaAppleAlt className="text-sm" />
                <span>Daily Targets Overview</span>
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-100/50 dark:bg-slate-900/40 rounded-xl border border-slate-200/20 text-left">
                  <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500">
                    CALORIES LIMIT
                  </span>
                  <span className="text-lg font-black">{dietPlan.calorieTarget} kcal</span>
                </div>
                <div className="p-3.5 bg-slate-100/50 dark:bg-slate-900/40 rounded-xl border border-slate-200/20 text-left">
                  <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500">
                    WATER TARGET
                  </span>
                  <span className="text-lg font-black">{dietPlan.waterRecommendationLiters} L</span>
                </div>
              </div>
            </GlassCard>

            {/* AI Explanation details */}
            <GlassCard>
              <h3 className="font-bold text-sm mb-3.5 flex items-center space-x-2">
                <FaCalendarAlt className="text-primary-500 text-xs" />
                <span>AI Clinical Explanation</span>
              </h3>
              <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {dietPlan.aiExplanation}
              </p>
            </GlassCard>

            {/* Grocery list check points */}
            <GlassCard>
              <h3 className="font-bold text-sm mb-4 flex items-center space-x-2">
                <FaClipboardList className="text-primary-500 text-xs" />
                <span>Weekly Grocery Ingredients</span>
              </h3>
              
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {dietPlan.groceryList && dietPlan.groceryList.map((item) => {
                  const isChecked = dietPlan.groceryChecked?.includes(item);
                  return (
                    <div
                      key={item}
                      onClick={() => handleToggleGrocery(item)}
                      className="flex items-center space-x-3 p-2.5 bg-slate-100/20 dark:bg-slate-900/10 hover:bg-slate-100/50 dark:hover:bg-slate-800/20 rounded-xl border border-slate-100 dark:border-slate-800/40 cursor-pointer transition-colors text-left"
                    >
                      {isChecked ? (
                        <FaCheckSquare className="text-primary-500 text-base" />
                      ) : (
                        <FaSquare className="text-slate-300 dark:text-slate-700 text-base" />
                      )}
                      <span className={`text-xs font-semibold ${isChecked ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-300'}`}>
                        {item}
                      </span>
                    </div>
                  );
                })}
              </div>
            </GlassCard>

          </div>

        </div>
      )}
    </div>
  );
};

export default DietPlan;
