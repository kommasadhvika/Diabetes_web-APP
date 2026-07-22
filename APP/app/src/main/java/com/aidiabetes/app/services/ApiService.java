package com.aidiabetes.app.services;

import com.aidiabetes.app.models.AiReport;
import com.aidiabetes.app.models.ChatMessage;
import com.aidiabetes.app.models.DietPlan;
import com.aidiabetes.app.models.ExerciseSchedule;
import com.aidiabetes.app.models.Profile;
import com.aidiabetes.app.models.SugarReading;
import com.aidiabetes.app.models.User;
import com.aidiabetes.app.models.WaterStatus;
import java.util.List;
import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.DELETE;
import retrofit2.http.GET;
import retrofit2.http.POST;
import retrofit2.http.PUT;
import retrofit2.http.Path;

public interface ApiService {

    // Auth API requests
    class LoginRequest {
        public String email;
        public String password;
        public LoginRequest(String email, String password) {
            this.email = email;
            this.password = password;
        }
    }

    class SignupRequest {
        public String name;
        public String email;
        public String password;
        public String phone;
        public SignupRequest(String name, String email, String password, String phone) {
            this.name = name;
            this.email = email;
            this.password = password;
            this.phone = phone;
        }
    }

    class OtpRequest {
        public String email;
        public String otp;
        public OtpRequest(String email, String otp) {
            this.email = email;
            this.otp = otp;
        }
    }

    // Response Classes
    class AuthResponse {
        public boolean success;
        public String message;
        public String token;
        public User user;
    }

    class ProfileResponse {
        public boolean success;
        public String message;
        public Profile profile;
    }

    class SugarHistoryResponse {
        public boolean success;
        public int count;
        public List<SugarReading> readings;
    }

    class SugarReadingResponse {
        public boolean success;
        public String message;
        public SugarReading reading;
    }

    class AiReportResponse {
        public boolean success;
        public AiReport report;
    }

    class GenericResponse {
        public boolean success;
        public String message;
    }

    class ChatRequest {
        public String message;
        public ChatRequest(String message) { this.message = message; }
    }

    class ChatHistoryResponse {
        public boolean success;
        public int count;
        public List<ChatMessage> messages;
    }

    class ChatResponse {
        public boolean success;
        public ChatMessage userMessage;
        public ChatMessage assistantMessage;
    }

    class DietPlanResponse {
        public boolean success;
        public DietPlan dietPlan;
    }

    class GroceryToggleRequest {
        public String item;
        public GroceryToggleRequest(String item) { this.item = item; }
    }

    // Water Intake Classes
    class WaterSettings {
        public int reminderIntervalMinutes;
        public boolean reminderEnabled;
        public String snoozedUntil;
    }

    class WaterStatusResponse {
        public boolean success;
        public String message;
        public WaterStatus todayLog;
        public WaterSettings settings;
    }

    class WaterIntakeRequest {
        public int amountMl;
        public WaterIntakeRequest(int amountMl) { this.amountMl = amountMl; }
    }

    class WaterSettingsRequest {
        public int reminderIntervalMinutes;
        public boolean reminderEnabled;
        public int snoozeMinutes;
        public WaterSettingsRequest(int interval, boolean enabled, int snooze) {
            this.reminderIntervalMinutes = interval;
            this.reminderEnabled = enabled;
            this.snoozeMinutes = snooze;
        }
    }

    // Exercise Planner Classes
    class ExerciseScheduleResponse {
        public boolean success;
        public String message;
        public ExerciseSchedule schedule;
    }

    class ExerciseLogRequest {
        public String name;
        public double durationMinutes;
        public int repsCompleted;
        public int caloriesBurned;
        public String category;
        public ExerciseLogRequest(String name, double duration, int reps, int calories, String category) {
            this.name = name;
            this.durationMinutes = duration;
            this.repsCompleted = reps;
            this.caloriesBurned = calories;
            this.category = category;
        }
    }

    // API endpoints mapping
    @POST("auth/login")
    Call<AuthResponse> login(@Body LoginRequest request);

    @POST("auth/signup")
    Call<AuthResponse> signup(@Body SignupRequest request);

    @POST("auth/verify-otp")
    Call<AuthResponse> verifyOtp(@Body OtpRequest request);

    @POST("auth/resend-otp")
    Call<GenericResponse> resendOtp(@Body OtpRequest request);

    @GET("profile")
    Call<ProfileResponse> getProfile();

    @POST("profile")
    Call<ProfileResponse> updateProfile(@Body Profile profile);

    @GET("sugar")
    Call<SugarHistoryResponse> getSugarHistory();

    @POST("sugar")
    Call<SugarReadingResponse> addSugarReading(@Body SugarReading reading);

    @DELETE("sugar/{id}")
    Call<GenericResponse> deleteSugarReading(@Path("id") String id);

    @GET("sugar/report")
    Call<AiReportResponse> getAiReport();

    @GET("chatbot")
    Call<ChatHistoryResponse> getChatHistory();

    @POST("chatbot")
    Call<ChatResponse> sendMessageToChatbot(@Body ChatRequest request);

    @DELETE("chatbot")
    Call<GenericResponse> clearChatHistory();

    @GET("diet")
    Call<DietPlanResponse> getDietPlan();

    @POST("diet/generate")
    Call<DietPlanResponse> generateDietPlan();

    @PUT("diet/grocery")
    Call<DietPlanResponse> toggleGroceryItem(@Body GroceryToggleRequest request);

    @GET("water")
    Call<WaterStatusResponse> getWaterStatus();

    @POST("water")
    Call<WaterStatusResponse> addWaterIntake(@Body WaterIntakeRequest request);

    @PUT("water/settings")
    Call<WaterStatusResponse> updateWaterSettings(@Body WaterSettingsRequest request);

    @GET("exercises/schedule")
    Call<ExerciseScheduleResponse> getExerciseSchedule();

    @POST("exercises/schedule/generate")
    Call<ExerciseScheduleResponse> generateExerciseSchedule();

    @POST("exercises/log")
    Call<GenericResponse> logExerciseActivity(@Body ExerciseLogRequest request);
}
