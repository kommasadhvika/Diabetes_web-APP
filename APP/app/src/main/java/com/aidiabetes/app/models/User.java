package com.aidiabetes.app.models;

public class User {
    private String id;
    private String name;
    private String email;
    private String phone;
    private boolean isVerified;
    private boolean profileCompleted;
    private String createdAt;

    public User() {
        // Required for Firebase deserialization
    }

    public User(String id, String name, String email, String phone, boolean isVerified, boolean profileCompleted, String createdAt) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.isVerified = isVerified;
        this.profileCompleted = profileCompleted;
        this.createdAt = createdAt;
    }

    // Getters and setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public boolean isVerified() { return isVerified; }
    public void setVerified(boolean verified) { isVerified = verified; }

    public boolean isProfileCompleted() { return profileCompleted; }
    public void setProfileCompleted(boolean profileCompleted) { this.profileCompleted = profileCompleted; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
