package com.aidiabetes.app.models;

public class ChatMessage {
    private String id;
    private String userId;
    private String sender; // "user" | "assistant"
    private String message;
    private String createdAt;

    public ChatMessage() {
    }

    public ChatMessage(String id, String userId, String sender, String message, String createdAt) {
        this.id = id;
        this.userId = userId;
        this.sender = sender;
        this.message = message;
        this.createdAt = createdAt;
    }

    // Getters and setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getSender() { return sender; }
    public void setSender(String sender) { this.sender = sender; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
