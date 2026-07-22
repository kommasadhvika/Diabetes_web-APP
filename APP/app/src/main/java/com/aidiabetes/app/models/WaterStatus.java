package com.aidiabetes.app.models;

import java.util.ArrayList;
import java.util.List;

public class WaterStatus {
    private String id;
    private String userId;
    private String date;
    private int intakeMl;
    private int goalMl;
    private List<WaterLogEntry> logs = new ArrayList<>();

    public static class WaterLogEntry {
        private int amountMl;
        private String loggedAt;
        private String timestamp;

        public WaterLogEntry() {}

        public int getAmountMl() { return amountMl; }
        public String getLoggedAt() { return loggedAt; }
        public String getTimestamp() { return timestamp; }
    }

    public WaterStatus() {}

    public String getId() { return id; }
    public String getUserId() { return userId; }
    public String getDate() { return date; }
    public int getIntakeMl() { return intakeMl; }
    public int getGoalMl() { return goalMl; }
    public List<WaterLogEntry> getLogs() { return logs; }

    public void setIntakeMl(int intakeMl) { this.intakeMl = intakeMl; }
    public void setGoalMl(int goalMl) { this.goalMl = goalMl; }
}
