package com.aidiabetes.app.fragments;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import com.aidiabetes.app.R;
import com.aidiabetes.app.firebase.FirebaseManager;
import com.aidiabetes.app.models.AiReport;
import com.aidiabetes.app.models.Profile;
import com.aidiabetes.app.models.SugarReading;
import com.aidiabetes.app.models.User;
import com.aidiabetes.app.services.ApiClient;
import com.aidiabetes.app.services.ApiService;
import com.aidiabetes.app.utils.SharedPreferencesManager;
import java.util.ArrayList;
import java.util.List;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class AiRecommendationFragment extends Fragment {

    private TextView tvScore, tvTrend, tvDisclaimer;
    private LinearLayout layoutTips, layoutDiets, layoutExercises;
    private ProgressBar progressBar;
    
    private SharedPreferencesManager prefs;
    private FirebaseManager firebaseManager;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_ai_recommendation, container, false);

        prefs = SharedPreferencesManager.getInstance(requireContext());
        firebaseManager = FirebaseManager.getInstance(requireContext());

        tvScore = view.findViewById(R.id.tv_ai_score);
        tvTrend = view.findViewById(R.id.tv_ai_trend);
        layoutTips = view.findViewById(R.id.layout_tips_list);
        layoutDiets = view.findViewById(R.id.layout_diet_list);
        layoutExercises = view.findViewById(R.id.layout_exercise_list);
        progressBar = view.findViewById(R.id.progress_bar);
        tvDisclaimer = view.findViewById(R.id.tv_disclaimer);

        loadRecommendations();
        return view;
    }

    private void loadRecommendations() {
        progressBar.setVisibility(View.VISIBLE);
        layoutTips.removeAllViews();
        layoutDiets.removeAllViews();
        layoutExercises.removeAllViews();

        if (prefs.isApiModeEnabled()) {
            ApiService api = ApiClient.getApiService(requireContext());
            api.getAiReport().enqueue(new Callback<ApiService.AiReportResponse>() {
                @Override
                public void onResponse(Call<ApiService.AiReportResponse> call, Response<ApiService.AiReportResponse> response) {
                    if (!isAdded() || getContext() == null) return;
                    progressBar.setVisibility(View.GONE);
                    if (response.isSuccessful() && response.body() != null && response.body().success) {
                        displayReport(response.body().report);
                    } else {
                        showErrorState("Complete your profile on the Profile tab to generate AI recommendations.");
                    }
                }

                @Override
                public void onFailure(Call<ApiService.AiReportResponse> call, Throwable t) {
                    if (!isAdded() || getContext() == null) return;
                    progressBar.setVisibility(View.GONE);
                    showErrorState("Network error connecting to Gemini AI: " + t.getMessage());
                }
            });
        } else {
            // Direct Local/Firebase Fallback Compile
            User user = prefs.getUser();
            if (user == null) {
                progressBar.setVisibility(View.GONE);
                return;
            }

            firebaseManager.fetchSugarHistory(user.getId(), new FirebaseManager.DataCallback<List<SugarReading>>() {
                @Override
                public void onSuccess(List<SugarReading> readings) {
                    if (!isAdded() || getContext() == null) return;
                    firebaseManager.fetchProfile(user.getId(), new FirebaseManager.DataCallback<Profile>() {
                        @Override
                        public void onSuccess(Profile profile) {
                            if (!isAdded() || getContext() == null) return;
                            progressBar.setVisibility(View.GONE);
                            AiReport compiled = compileLocalReport(profile, readings);
                            displayReport(compiled);
                        }

                        @Override
                        public void onFailure(String error) {
                            if (!isAdded() || getContext() == null) return;
                            progressBar.setVisibility(View.GONE);
                            showErrorState("Please complete your profile to enable AI recommendations.");
                        }
                    });
                }

                @Override
                public void onFailure(String error) {
                    if (!isAdded() || getContext() == null) return;
                    progressBar.setVisibility(View.GONE);
                    showErrorState("Could not retrieve readings logs.");
                }
            });
        }
    }

    private void displayReport(AiReport report) {
        if (!isAdded() || getContext() == null) return;
        tvScore.setText("Health Score: " + report.getHealthScore() + "/100");
        tvTrend.setText(report.getTrendMessage());

        LayoutInflater inflater = LayoutInflater.from(getContext());

        // Display checklist items
        for (String tip : report.getTips()) {
            View itemView = inflater.inflate(android.R.layout.simple_list_item_1, layoutTips, false);
            TextView tv = itemView.findViewById(android.R.id.text1);
            tv.setText("⭐ " + tip);
            tv.setTextSize(13);
            tv.setPadding(8, 12, 8, 12);
            layoutTips.addView(itemView);
        }

        // Display Diet advice
        for (String diet : report.getDietSuggestions()) {
            View itemView = inflater.inflate(android.R.layout.simple_list_item_1, layoutDiets, false);
            TextView tv = itemView.findViewById(android.R.id.text1);
            tv.setText("🥗 " + diet);
            tv.setTextSize(13);
            tv.setPadding(8, 12, 8, 12);
            layoutDiets.addView(itemView);
        }

        // Display Workouts advice
        for (String ex : report.getExerciseSuggestions()) {
            View itemView = inflater.inflate(android.R.layout.simple_list_item_1, layoutExercises, false);
            TextView tv = itemView.findViewById(android.R.id.text1);
            tv.setText("🏃 " + ex);
            tv.setTextSize(13);
            tv.setPadding(8, 12, 8, 12);
            layoutExercises.addView(itemView);
        }

        tvDisclaimer.setText("DiaPredict AI Disclaimer: Information provided is informational. Coordinate treatment decisions with your primary physician.");
    }

    private void showErrorState(String message) {
        if (!isAdded() || getContext() == null) return;
        tvScore.setText("AI Advisor Idle");
        tvTrend.setText(message);
    }

    private AiReport compileLocalReport(Profile profile, List<SugarReading> readings) {
        AiReport report = new AiReport();
        
        // Calculations
        double weight = profile.getWeight();
        double heightInM = profile.getHeight() / 100.0;
        double bmi = weight / (heightInM * heightInM);
        String bmiCategory = (bmi < 18.5) ? "Underweight" : (bmi < 25) ? "Normal" : (bmi < 30) ? "Overweight" : "Obese";
        
        report.setBmi(bmi);
        report.setBmiCategory(bmiCategory);

        int score = 80;
        List<String> tips = new ArrayList<>();
        List<String> diets = new ArrayList<>();
        List<String> exercises = new ArrayList<>();

        if (readings != null && !readings.isEmpty()) {
            SugarReading latest = readings.get(0);
            if (latest.getValue() >= 180) {
                score = 55;
                report.setTrendMessage("WARNING: High glycemic readings logged recently. Fasting/AfterMeal values exceed normal thresholds.");
                
                tips.add("Limit all simple carbohydrates and sugar immediately.");
                tips.add("Hydrate heavily to help clean excess glucose.");
                tips.add("Walk 15 minutes immediately after every meal.");

                diets.add("Incorporate high-fiber green vegetables, lentils, and clean proteins like tofu or paneer.");
                diets.add("Strictly avoid white rice, white bread, soda, and sweet juices.");

                exercises.add("Perform 45 minutes of brisk walking or light jogging daily.");
                exercises.add("Add stress-relieving yoga poses to control cortisol levels.");
            } else {
                score = 90;
                report.setTrendMessage("Glucose levels are within stable ranges. Maintain consistent checking.");
                
                tips.add("Maintain consistent meal schedules.");
                tips.add("Incorporate strength training to build glucose-receptive muscle.");

                diets.add("Maintain proportional proteins, complex carbohydrates, and good fats.");
                diets.add("Stay away from ultra-processed snacks.");

                exercises.add("Continue your active routine. Aim for 30 minutes of cardio daily.");
            }
        } else {
            report.setTrendMessage("No readings logged. Record blood sugar values on the logging tab.");
            tips.add("Start logging your readings.");
            diets.add("Eat a balanced, diabetic-friendly diet.");
            exercises.add("Walk 30 minutes daily.");
        }

        report.setHealthScore(score);
        report.setTips(tips);
        report.setDietSuggestions(diets);
        report.setExerciseSuggestions(exercises);
        
        return report;
    }
}
