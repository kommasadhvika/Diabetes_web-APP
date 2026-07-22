package com.aidiabetes.app.models;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ExerciseSchedule {
    private String userId;
    private Map<String, List<ExerciseItem>> weeklyPlan = new HashMap<>();
    private String createdAt;
    private String updatedAt;

    public static class ExerciseItem {
        private String name;
        private int duration; // in minutes
        private String repetitions; // e.g. "12 reps x 3 sets"
        private int caloriesBurned;
        private String difficulty; // Easy, Medium, Hard
        private String imageUrl;
        private String videoUrl;
        private String youtubeId;

        public ExerciseItem() {}

        public ExerciseItem(String name, int duration, String repetitions, int caloriesBurned, String difficulty, String imageUrl, String videoUrl, String youtubeId) {
            this.name = name;
            this.duration = duration;
            this.repetitions = repetitions;
            this.caloriesBurned = caloriesBurned;
            this.difficulty = difficulty;
            this.imageUrl = imageUrl;
            this.videoUrl = videoUrl;
            this.youtubeId = youtubeId;
        }

        public String getName() { return name; }
        public int getDuration() { return duration; }
        public String getRepetitions() { return repetitions; }
        public int getCaloriesBurned() { return caloriesBurned; }
        public String getDifficulty() { return difficulty; }
        public String getImageUrl() { return imageUrl; }
        public String getVideoUrl() { return videoUrl; }
        public String getYoutubeId() { return youtubeId; }
    }

    public ExerciseSchedule() {}

    public String getUserId() { return userId; }
    public Map<String, List<ExerciseItem>> getWeeklyPlan() { return weeklyPlan; }
    public String getCreatedAt() { return createdAt; }
    public String getUpdatedAt() { return updatedAt; }

    public void setWeeklyPlan(Map<String, List<ExerciseItem>> weeklyPlan) {
        this.weeklyPlan = weeklyPlan;
    }
}
