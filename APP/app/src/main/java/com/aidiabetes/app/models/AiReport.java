package com.aidiabetes.app.models;

import java.util.ArrayList;
import java.util.List;

public class AiReport {
    private double bmi;
    private String bmiCategory;
    private int healthScore;
    private int calorieTarget;
    private double waterTargetLiters;
    private int waterTargetMl;
    private String riskLevel;
    private String classification;
    private String trendMessage;
    private List<String> tips = new ArrayList<>();
    private List<String> dietSuggestions = new ArrayList<>();
    private List<String> exerciseSuggestions = new ArrayList<>();
    private String generatedAt;

    public AiReport() {
    }

    // Getters and setters
    public double getBmi() { return bmi; }
    public void setBmi(double bmi) { this.bmi = bmi; }

    public String getBmiCategory() { return bmiCategory; }
    public void setBmiCategory(String bmiCategory) { this.bmiCategory = bmiCategory; }

    public int getHealthScore() { return healthScore; }
    public void setHealthScore(int healthScore) { this.healthScore = healthScore; }

    public int getCalorieTarget() { return calorieTarget; }
    public void setCalorieTarget(int calorieTarget) { this.calorieTarget = calorieTarget; }

    public double getWaterTargetLiters() { return waterTargetLiters; }
    public void setWaterTargetLiters(double waterTargetLiters) { this.waterTargetLiters = waterTargetLiters; }

    public int getWaterTargetMl() { return waterTargetMl; }
    public void setWaterTargetMl(int waterTargetMl) { this.waterTargetMl = waterTargetMl; }

    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }

    public String getClassification() { return classification; }
    public void setClassification(String classification) { this.classification = classification; }

    public String getTrendMessage() { return trendMessage; }
    public void setTrendMessage(String trendMessage) { this.trendMessage = trendMessage; }

    public List<String> getTips() { return tips; }
    public void setTips(List<String> tips) { this.tips = tips; }

    public List<String> getDietSuggestions() { return dietSuggestions; }
    public void setDietSuggestions(List<String> dietSuggestions) { this.dietSuggestions = dietSuggestions; }

    public List<String> getExerciseSuggestions() { return exerciseSuggestions; }
    public void setExerciseSuggestions(List<String> exerciseSuggestions) { this.exerciseSuggestions = exerciseSuggestions; }

    public String getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(String generatedAt) { this.generatedAt = generatedAt; }
}
