package com.aidiabetes.app.models;

public class Profile {
    private String userId;
    private String fullName;
    private int age;
    private String gender;
    private float height; // in cm
    private float weight; // in kg
    private String diabetesType;
    private String activityLevel;
    private String medicalNotes;
    private String updatedAt;

    public Profile() {
        // Required for Firebase
    }

    public Profile(String userId, String fullName, int age, String gender, float height, float weight, String diabetesType, String activityLevel, String medicalNotes, String updatedAt) {
        this.userId = userId;
        this.fullName = fullName;
        this.age = age;
        this.gender = gender;
        this.height = height;
        this.weight = weight;
        this.diabetesType = diabetesType;
        this.activityLevel = activityLevel;
        this.medicalNotes = medicalNotes;
        this.updatedAt = updatedAt;
    }

    // Getters and setters
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public int getAge() { return age; }
    public void setAge(int age) { this.age = age; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public float getHeight() { return height; }
    public void setHeight(float height) { this.height = height; }

    public float getWeight() { return weight; }
    public void setWeight(float weight) { this.weight = weight; }

    public String getDiabetesType() { return diabetesType; }
    public void setDiabetesType(String diabetesType) { this.diabetesType = diabetesType; }

    public String getActivityLevel() { return activityLevel; }
    public void setActivityLevel(String activityLevel) { this.activityLevel = activityLevel; }

    public String getMedicalNotes() { return medicalNotes; }
    public void setMedicalNotes(String medicalNotes) { this.medicalNotes = medicalNotes; }

    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }
}
