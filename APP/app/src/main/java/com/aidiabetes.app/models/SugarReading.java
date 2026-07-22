package com.aidiabetes.app.models;

public class SugarReading {
    private String id;
    private String userId;
    private String type; // 'fasting' | 'afterMeal' | 'random'
    private double value;
    private String classification; // 'NORMAL' | 'PREDIABETIC' | 'HIGH DIABETES RISK'
    private String riskLevel; // 'Low' | 'Medium' | 'High'
    private String notes;
    private String createdAt;

    public SugarReading() {
        // Required for Firebase
    }

    public SugarReading(String id, String userId, String type, double value, String classification, String riskLevel, String notes, String createdAt) {
        this.id = id;
        this.userId = userId;
        this.type = type;
        this.value = value;
        this.classification = classification;
        this.riskLevel = riskLevel;
        this.notes = notes;
        this.createdAt = createdAt;
    }

    // Getters and setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public double getValue() { return value; }
    public void setValue(double value) { this.value = value; }

    public String getClassification() { return classification; }
    public void setClassification(String classification) { this.classification = classification; }

    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
