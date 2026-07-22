package com.aidiabetes.app.fragments;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import com.aidiabetes.app.R;
import com.aidiabetes.app.models.DietPlan;
import com.aidiabetes.app.services.ApiClient;
import com.aidiabetes.app.services.ApiService;
import com.aidiabetes.app.utils.SharedPreferencesManager;
import android.widget.ImageView;
import com.bumptech.glide.Glide;
import com.google.android.material.bottomsheet.BottomSheetDialog;
import java.util.ArrayList;
import java.util.List;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class DietPlanFragment extends Fragment {

    private TextView tvCalTarget, tvWaterTarget, tvAiExplanation;
    private Button btnRegenerate;
    private LinearLayout layoutDaysTabs, layoutMealsContainer, layoutGroceryList;
    
    private SharedPreferencesManager prefs;
    private DietPlan currentDietPlan;
    private String activeDay = "Monday";
    private final String[] daysOfWeek = {"Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"};

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_diet_plan, container, false);

        prefs = SharedPreferencesManager.getInstance(requireContext());

        tvCalTarget = view.findViewById(R.id.tv_diet_cal_target);
        tvWaterTarget = view.findViewById(R.id.tv_diet_water_target);
        tvAiExplanation = view.findViewById(R.id.tv_diet_ai_explanation);
        btnRegenerate = view.findViewById(R.id.btn_regenerate_diet);
        layoutDaysTabs = view.findViewById(R.id.layout_days_tabs);
        layoutMealsContainer = view.findViewById(R.id.layout_meals_container);
        layoutGroceryList = view.findViewById(R.id.layout_grocery_list);

        btnRegenerate.setOnClickListener(v -> handleRegenerate());

        loadDietPlan();

        return view;
    }

    private void loadDietPlan() {
        if (prefs.isApiModeEnabled()) {
            ApiService api = ApiClient.getApiService(requireContext());
            api.getDietPlan().enqueue(new Callback<ApiService.DietPlanResponse>() {
                @Override
                public void onResponse(Call<ApiService.DietPlanResponse> call, Response<ApiService.DietPlanResponse> response) {
                    if (!isAdded() || getContext() == null) return;
                    if (response.isSuccessful() && response.body() != null && response.body().success) {
                        currentDietPlan = response.body().dietPlan;
                        updateUI();
                    } else {
                        Toast.makeText(getContext(), "Failed to load diet plan", Toast.LENGTH_SHORT).show();
                        setupMockDietPlan();
                    }
                }

                @Override
                public void onFailure(Call<ApiService.DietPlanResponse> call, Throwable t) {
                    if (!isAdded() || getContext() == null) return;
                    Toast.makeText(getContext(), "API error, loading sandbox diet", Toast.LENGTH_SHORT).show();
                    setupMockDietPlan();
                }
            });
        } else {
            setupMockDietPlan();
        }
    }

    private void setupMockDietPlan() {
        if (currentDietPlan == null) {
            currentDietPlan = new DietPlan();
            // Set basic variables
            // Reflect the profile incomplete state fallback or a default prediabetic setup
            currentDietPlan = createDefaultMockPlan();
        }
        updateUI();
    }

    private DietPlan createDefaultMockPlan() {
        DietPlan plan = new DietPlan();
        
        // Calorie and Water targets
        int calories = 1800;
        double water = 2.7;
        
        // Let's populate the schedule list
        List<DietPlan.DaySchedule> schedule = new ArrayList<>();
        
        // Helper to populate individual meal items
        for (String d : daysOfWeek) {
            DietPlan.DaySchedule ds = new DietPlan.DaySchedule();
            
            // Set day
            java.lang.reflect.Field dayField;
            try {
                dayField = DietPlan.DaySchedule.class.getDeclaredField("day");
                dayField.setAccessible(true);
                dayField.set(ds, d);
                
                dayField = DietPlan.DaySchedule.class.getDeclaredField("totalCalories");
                dayField.setAccessible(true);
                dayField.set(ds, 1500);
            } catch (Exception e) {
                e.printStackTrace();
            }

            DietPlan.Meal breakfast = createMeal("Oatmeal with Blueberries & Almonds", 350, 45, 12, 10, "08:00 AM", "Low", "Rich in soluble beta-glucan fiber which delays glucose absorption and stabilizes insulin response.");
            DietPlan.Meal lunch = createMeal("Quinoa & Grilled Tofu Salad", 500, 50, 25, 12, "01:00 PM", "Low", "Tofu provides plant-based protein which increases satiety, and quinoa supplies slow-burning complex carbs.");
            DietPlan.Meal snacks = createMeal("Chia Seed Pudding with Walnuts", 180, 15, 6, 12, "04:30 PM", "Low", "Chia seeds form a gel in the stomach that slows digestional carbohydrate conversions.");
            DietPlan.Meal dinner = createMeal("Lentil Soup with Steamed Spinach", 450, 48, 20, 8, "07:30 PM", "Low", "High fiber lentils combined with leafy greens keep glucose levels steady overnight.");

            try {
                java.lang.reflect.Field bField = DietPlan.DaySchedule.class.getDeclaredField("breakfast");
                bField.setAccessible(true);
                bField.set(ds, breakfast);

                java.lang.reflect.Field lField = DietPlan.DaySchedule.class.getDeclaredField("lunch");
                lField.setAccessible(true);
                lField.set(ds, lunch);

                java.lang.reflect.Field sField = DietPlan.DaySchedule.class.getDeclaredField("snacks");
                sField.setAccessible(true);
                sField.set(ds, snacks);

                java.lang.reflect.Field dField = DietPlan.DaySchedule.class.getDeclaredField("dinner");
                dField.setAccessible(true);
                dField.set(ds, dinner);
            } catch (Exception e) {
                e.printStackTrace();
            }

            schedule.add(ds);
        }

        // Set list values
        List<String> groceryList = new ArrayList<>();
        groceryList.add("Steel-cut oats");
        groceryList.add("Fresh blueberries");
        groceryList.add("Almond nuts");
        groceryList.add("Organic quinoa");
        groceryList.add("Firm tofu");
        groceryList.add("Chia seeds");
        groceryList.add("Walnuts");
        groceryList.add("Brown lentils");
        groceryList.add("Fresh baby spinach");

        try {
            java.lang.reflect.Field f = DietPlan.class.getDeclaredField("dietType");
            f.setAccessible(true);
            f.set(plan, "Indian-Vegetarian");

            f = DietPlan.class.getDeclaredField("calorieTarget");
            f.setAccessible(true);
            f.set(plan, calories);

            f = DietPlan.class.getDeclaredField("waterRecommendationLiters");
            f.setAccessible(true);
            f.set(plan, water);

            f = DietPlan.class.getDeclaredField("schedule");
            f.setAccessible(true);
            f.set(plan, schedule);

            f = DietPlan.class.getDeclaredField("groceryList");
            f.setAccessible(true);
            f.set(plan, groceryList);

            f = DietPlan.class.getDeclaredField("groceryChecked");
            f.setAccessible(true);
            f.set(plan, new ArrayList<String>());

            f = DietPlan.class.getDeclaredField("aiExplanation");
            f.setAccessible(true);
            f.set(plan, "Your clinical profile indicates prediabetic insulin resistance. This 7-day schedule prioritizes high-fiber vegetables, low glycemic index carbs, and healthy fats. It avoids rapid spikes while maintaining stable daily caloric targets.");

        } catch (Exception e) {
            e.printStackTrace();
        }

        return plan;
    }

 private DietPlan.Meal createMeal(String name, int calories, int carbs, int protein, int fat, String time, String gi, String why) {
        DietPlan.Meal m = new DietPlan.Meal();
        try {
            java.lang.reflect.Field f = DietPlan.Meal.class.getDeclaredField("name");
            f.setAccessible(true); f.set(m, name);

            f = DietPlan.Meal.class.getDeclaredField("calories");
            f.setAccessible(true); f.set(m, calories);

            f = DietPlan.Meal.class.getDeclaredField("carbs");
            f.setAccessible(true); f.set(m, carbs);

            f = DietPlan.Meal.class.getDeclaredField("protein");
            f.setAccessible(true); f.set(m, protein);

            f = DietPlan.Meal.class.getDeclaredField("fat");
            f.setAccessible(true); f.set(m, fat);

            f = DietPlan.Meal.class.getDeclaredField("time");
            f.setAccessible(true); f.set(m, time);

            f = DietPlan.Meal.class.getDeclaredField("glycemicImpact");
            f.setAccessible(true); f.set(m, gi);

            f = DietPlan.Meal.class.getDeclaredField("whyRecommended");
            f.setAccessible(true); f.set(m, why);
            
            f = DietPlan.Meal.class.getDeclaredField("imageUrl");
            f.setAccessible(true);
            if (name.contains("Oatmeal")) f.set(m, "https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?w=400&q=80");
            else if (name.contains("Quinoa")) f.set(m, "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80");
            else if (name.contains("Chia")) f.set(m, "https://images.unsplash.com/photo-1596560548464-f010689b7f4f?w=400&q=80");
            else f.set(m, "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80");

            List<String> mockIngredients = new ArrayList<>();
            mockIngredients.add("1 serving basic base components");
            mockIngredients.add("1 pinch organic seasoning");
            mockIngredients.add("Healthy fats to taste");
            f = DietPlan.Meal.class.getDeclaredField("ingredients");
            f.setAccessible(true); f.set(m, mockIngredients);

            List<String> mockSteps = new ArrayList<>();
            mockSteps.add("Prep and wash raw items.");
            mockSteps.add("Cook on low/moderate heat to protect nutritional structure.");
            mockSteps.add("Garnish with glycemic-neutral toppers.");
            f = DietPlan.Meal.class.getDeclaredField("cookingSteps");
            f.setAccessible(true); f.set(m, mockSteps);

            f = DietPlan.Meal.class.getDeclaredField("prepTimeMinutes");
            f.setAccessible(true); f.set(m, 15);
        } catch (Exception e) {
            e.printStackTrace();
        }
        return m;
    }

    private void updateUI() {
        if (!isAdded() || getContext() == null) return;
        if (currentDietPlan == null) return;

        tvCalTarget.setText(currentDietPlan.getCalorieTarget() + " kcal");
        tvWaterTarget.setText(String.format("%.1f Liters", currentDietPlan.getWaterRecommendationLiters()));
        tvAiExplanation.setText(currentDietPlan.getAiExplanation());

        renderDaysTabs();
        renderActiveMeals();
        renderGroceryList();
    }

    private void renderDaysTabs() {
        layoutDaysTabs.removeAllViews();
        for (String day : daysOfWeek) {
            Button btn = new Button(getContext());
            
            // Layout params
            LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.WRAP_CONTENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
            );
            lp.setMargins(0, 0, 16, 0);
            btn.setLayoutParams(lp);

            btn.setText(day);
            btn.setTextSize(12);
            btn.setAllCaps(false);
            btn.setPadding(24, 8, 24, 8);

            // Styling active vs inactive
            if (day.equalsIgnoreCase(activeDay)) {
                btn.setBackgroundColor(androidx.core.content.ContextCompat.getColor(getContext(), R.color.primary));
                btn.setTextColor(androidx.core.content.ContextCompat.getColor(getContext(), R.color.white));
            } else {
                btn.setBackgroundColor(androidx.core.content.ContextCompat.getColor(getContext(), R.color.white));
                btn.setTextColor(androidx.core.content.ContextCompat.getColor(getContext(), R.color.text_dark));
            }

            btn.setOnClickListener(v -> {
                activeDay = day;
                renderDaysTabs();
                renderActiveMeals();
            });

            layoutDaysTabs.addView(btn);
        }
    }

    private void renderActiveMeals() {
        layoutMealsContainer.removeAllViews();
        if (currentDietPlan == null || currentDietPlan.getSchedule() == null) return;

        DietPlan.DaySchedule activeSchedule = null;
        for (DietPlan.DaySchedule ds : currentDietPlan.getSchedule()) {
            if (activeDay.equalsIgnoreCase(ds.getDay())) {
                activeSchedule = ds;
                break;
            }
        }

        if (activeSchedule != null) {
            addMealToLayout(activeSchedule.getBreakfast(), "Breakfast");
            addMealToLayout(activeSchedule.getLunch(), "Lunch");
            addMealToLayout(activeSchedule.getSnacks(), "Evening Snack");
            addMealToLayout(activeSchedule.getDinner(), "Dinner");
        }
    }

    private void addMealToLayout(DietPlan.Meal meal, String typeLabel) {
        if (meal == null) return;

        LayoutInflater inflater = LayoutInflater.from(getContext());
        View view = inflater.inflate(R.layout.item_meal, layoutMealsContainer, false);

        ImageView ivMealImage = view.findViewById(R.id.iv_meal_image);
        TextView tvTypeTime = view.findViewById(R.id.tv_meal_type_time);
        TextView tvCalories = view.findViewById(R.id.tv_meal_calories);
        TextView tvName = view.findViewById(R.id.tv_meal_name);
        TextView tvGi = view.findViewById(R.id.tv_meal_gi);
        TextView tvMacros = view.findViewById(R.id.tv_meal_macros);
        TextView tvWhy = view.findViewById(R.id.tv_meal_why);

        tvTypeTime.setText(typeLabel.toUpperCase() + " (" + (meal.getTime() != null ? meal.getTime() : "N/A") + ")");
        tvCalories.setText(meal.getCalories() + " kcal");
        tvName.setText(meal.getName());
        tvGi.setText("GI: " + (meal.getGlycemicImpact() != null ? meal.getGlycemicImpact().toUpperCase() : "LOW"));
        
        tvMacros.setText(String.format("CARBS: %dg  •  PROTEIN: %dg  •  FAT: %dg", 
                meal.getCarbs(), meal.getProtein(), meal.getFat()));
        
        tvWhy.setText(meal.getWhyRecommended());

        // Load visual image illustration
        if (meal.getImageUrl() != null && !meal.getImageUrl().isEmpty()) {
            ivMealImage.setVisibility(View.VISIBLE);
            Glide.with(this)
                    .load(meal.getImageUrl())
                    .placeholder(android.R.drawable.ic_menu_gallery)
                    .into(ivMealImage);
        } else {
            ivMealImage.setVisibility(View.GONE);
        }

        // Set card click listener for Recipe Builder view
        view.setOnClickListener(v -> showRecipeDialog(meal));

        layoutMealsContainer.addView(view);
    }

    private void showRecipeDialog(DietPlan.Meal meal) {
        if (meal == null) return;

        BottomSheetDialog dialog = new BottomSheetDialog(requireContext());
        View dialogView = getLayoutInflater().inflate(R.layout.dialog_recipe, null);

        ImageView ivImage = dialogView.findViewById(R.id.iv_recipe_image);
        TextView tvTitle = dialogView.findViewById(R.id.tv_recipe_title);
        TextView tvPrepTime = dialogView.findViewById(R.id.tv_recipe_prep_time);
        TextView tvIngredients = dialogView.findViewById(R.id.tv_recipe_ingredients);
        TextView tvSteps = dialogView.findViewById(R.id.tv_recipe_steps);

        tvTitle.setText(meal.getName());
        tvPrepTime.setText("Preparation Time: " + meal.getPrepTimeMinutes() + " mins");

        if (meal.getImageUrl() != null && !meal.getImageUrl().isEmpty()) {
            Glide.with(this)
                    .load(meal.getImageUrl())
                    .into(ivImage);
        } else {
            ivImage.setImageResource(android.R.drawable.ic_menu_gallery);
        }

        // Format Ingredients bullet list
        StringBuilder ingBuilder = new StringBuilder();
        if (meal.getIngredients() != null && !meal.getIngredients().isEmpty()) {
            for (String ing : meal.getIngredients()) {
                ingBuilder.append("• ").append(ing).append("\n");
            }
        } else {
            ingBuilder.append("• Glycemic balanced nutrition guidelines.");
        }
        tvIngredients.setText(ingBuilder.toString().trim());

        // Format Cooking Steps numbered list
        StringBuilder stepsBuilder = new StringBuilder();
        if (meal.getCookingSteps() != null && !meal.getCookingSteps().isEmpty()) {
            int stepNum = 1;
            for (String step : meal.getCookingSteps()) {
                stepsBuilder.append(stepNum).append(". ").append(step).append("\n\n");
                stepNum++;
            }
        } else {
            stepsBuilder.append("1. Follow clinical instructions.\n2. Portion according to recommended calorie and carb budgets.");
        }
        tvSteps.setText(stepsBuilder.toString().trim());

        dialog.setContentView(dialogView);
        dialog.show();
    }

    private void renderGroceryList() {
        layoutGroceryList.removeAllViews();
        if (currentDietPlan == null || currentDietPlan.getGroceryList() == null) return;

        List<String> checkedList = currentDietPlan.getGroceryChecked();
        if (checkedList == null) {
            checkedList = new ArrayList<>();
        }

        LayoutInflater inflater = LayoutInflater.from(getContext());

        for (String item : currentDietPlan.getGroceryList()) {
            View view = inflater.inflate(R.layout.item_grocery, layoutGroceryList, false);
            CheckBox cb = view.findViewById(R.id.cb_grocery_item);
            
            cb.setText(item);
            
            final boolean isChecked = checkedList.contains(item);
            cb.setChecked(isChecked);

            cb.setOnClickListener(v -> toggleGroceryItem(item));

            layoutGroceryList.addView(view);
        }
    }

    private void toggleGroceryItem(String item) {
        if (prefs.isApiModeEnabled()) {
            ApiService api = ApiClient.getApiService(requireContext());
            api.toggleGroceryItem(new ApiService.GroceryToggleRequest(item)).enqueue(new Callback<ApiService.DietPlanResponse>() {
                @Override
                public void onResponse(Call<ApiService.DietPlanResponse> call, Response<ApiService.DietPlanResponse> response) {
                    if (!isAdded() || getContext() == null) return;
                    if (response.isSuccessful() && response.body() != null && response.body().success) {
                        currentDietPlan = response.body().dietPlan;
                        updateUI();
                    } else {
                        Toast.makeText(getContext(), "Failed to toggle grocery item", Toast.LENGTH_SHORT).show();
                    }
                }

                @Override
                public void onFailure(Call<ApiService.DietPlanResponse> call, Throwable t) {
                    if (!isAdded() || getContext() == null) return;
                    Toast.makeText(getContext(), "API network error", Toast.LENGTH_SHORT).show();
                }
            });
        } else {
            // Local fallback sandbox toggle
            List<String> checked = currentDietPlan.getGroceryChecked();
            if (checked == null) {
                checked = new ArrayList<>();
            }
            if (checked.contains(item)) {
                checked.remove(item);
            } else {
                checked.add(item);
            }
            currentDietPlan.setGroceryChecked(checked);
            updateUI();
        }
    }

    private void handleRegenerate() {
        btnRegenerate.setEnabled(false);
        btnRegenerate.setText("Regenerating...");

        if (prefs.isApiModeEnabled()) {
            ApiService api = ApiClient.getApiService(requireContext());
            api.generateDietPlan().enqueue(new Callback<ApiService.DietPlanResponse>() {
                @Override
                public void onResponse(Call<ApiService.DietPlanResponse> call, Response<ApiService.DietPlanResponse> response) {
                    if (!isAdded() || getContext() == null) return;
                    btnRegenerate.setEnabled(true);
                    btnRegenerate.setText("Regenerate");
                    if (response.isSuccessful() && response.body() != null && response.body().success) {
                        currentDietPlan = response.body().dietPlan;
                        updateUI();
                        Toast.makeText(getContext(), "Diet plan updated!", Toast.LENGTH_SHORT).show();
                    } else {
                        Toast.makeText(getContext(), "Regeneration failed", Toast.LENGTH_SHORT).show();
                    }
                }

                @Override
                public void onFailure(Call<ApiService.DietPlanResponse> call, Throwable t) {
                    if (!isAdded() || getContext() == null) return;
                    btnRegenerate.setEnabled(true);
                    btnRegenerate.setText("Regenerate");
                    Toast.makeText(getContext(), "API network error: " + t.getMessage(), Toast.LENGTH_SHORT).show();
                }
            });
        } else {
            // Local mockup regeneration
            new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(() -> {
                if (!isAdded() || getContext() == null) return;
                btnRegenerate.setEnabled(true);
                btnRegenerate.setText("Regenerate");
                currentDietPlan = createDefaultMockPlan();
                updateUI();
                Toast.makeText(getContext(), "New diet plan generated in dev sandbox!", Toast.LENGTH_SHORT).show();
            }, 1000);
        }
    }
}
