package com.aidiabetes.app.models;

import java.util.ArrayList;
import java.util.List;

public class DietPlan {
    private String dietType;
    private int calorieTarget;
    private double waterRecommendationLiters;
    private List<DaySchedule> schedule = new ArrayList<>();
    private List<String> groceryList = new ArrayList<>();
    private List<String> groceryChecked = new ArrayList<>();
    private String aiExplanation;

    public DietPlan() {
    }

    // Static nested classes for mapping json hierarchies
    public static class Meal {
        private String name;
        private int calories;
        private int carbs;
        private int protein;
        private int fat;
        private String time;
        private String glycemicImpact;
        private String whyRecommended;
        private String imageUrl;
        private List<String> ingredients;
        private List<String> cookingSteps;
        private int prepTimeMinutes;

        public Meal() {}

        public String getName() { return name; }
        public int getCalories() { return calories; }
        public int getCarbs() { return carbs; }
        public int getProtein() { return protein; }
        public int getFat() { return fat; }
        public String getTime() { return time; }
        public String getGlycemicImpact() { return glycemicImpact; }
        public String getWhyRecommended() { return whyRecommended; }
        public String getImageUrl() { return imageUrl; }
        public List<String> getIngredients() { return ingredients; }
        public List<String> getCookingSteps() { return cookingSteps; }
        public int getPrepTimeMinutes() { return prepTimeMinutes; }
    }

    public static class DaySchedule {
        private String day;
        private Meal breakfast;
        private Meal lunch;
        private Meal dinner;
        private Meal snacks;
        private int totalCalories;

        public DaySchedule() {}

        public String getDay() { return day; }
        public Meal getBreakfast() { return breakfast; }
        public Meal getLunch() { return lunch; }
        public Meal getDinner() { return dinner; }
        public Meal getSnacks() { return snacks; }
        public int getTotalCalories() { return totalCalories; }
    }

    // Getters and setters for DietPlan
    public String getDietType() { return dietType; }
    public int getCalorieTarget() { return calorieTarget; }
    public double getWaterRecommendationLiters() { return waterRecommendationLiters; }
    public List<DaySchedule> getSchedule() { return schedule; }
    public List<String> getGroceryList() { return groceryList; }
    public List<String> getGroceryChecked() { return groceryChecked; }
    public String getAiExplanation() { return aiExplanation; }

    public void setGroceryChecked(List<String> groceryChecked) {
        this.groceryChecked = groceryChecked;
    }
}
