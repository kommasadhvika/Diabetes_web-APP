package com.aidiabetes.app.fragments;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import com.aidiabetes.app.R;
import com.aidiabetes.app.activities.MainActivity;
import com.aidiabetes.app.firebase.FirebaseManager;
import com.aidiabetes.app.models.AiReport;
import com.aidiabetes.app.models.Profile;
import com.aidiabetes.app.models.SugarReading;
import com.aidiabetes.app.models.User;
import com.aidiabetes.app.services.ApiClient;
import com.aidiabetes.app.services.ApiService;
import com.aidiabetes.app.fragments.CalculatorsFragment;
import com.aidiabetes.app.fragments.ChatbotFragment;
import com.aidiabetes.app.fragments.DietPlanFragment;
import com.aidiabetes.app.utils.SharedPreferencesManager;
import java.util.List;
import java.util.Locale;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class DashboardFragment extends Fragment {

    private TextView tvWelcome, tvAvgGlucose, tvBmi, tvCalorieTarget, tvHba1c, tvHealthScore, tvRiskLevel, tvTrendMessage;
    private Button btnLogGlucose, btnAiRecommendations;
    private SharedPreferencesManager prefs;
    private FirebaseManager firebaseManager;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_dashboard, container, false);

        prefs = SharedPreferencesManager.getInstance(requireContext());
        firebaseManager = FirebaseManager.getInstance(requireContext());

        tvWelcome = view.findViewById(R.id.tv_welcome);
        tvAvgGlucose = view.findViewById(R.id.tv_avg_glucose);
        tvBmi = view.findViewById(R.id.tv_bmi);
        tvCalorieTarget = view.findViewById(R.id.tv_calorie_target);
        tvHba1c = view.findViewById(R.id.tv_hba1c);
        tvHealthScore = view.findViewById(R.id.tv_health_score);
        tvRiskLevel = view.findViewById(R.id.tv_risk_level);
        tvTrendMessage = view.findViewById(R.id.tv_trend_message);
        
        btnLogGlucose = view.findViewById(R.id.btn_log_glucose);
        btnAiRecommendations = view.findViewById(R.id.btn_ai_recs);

        User currentUser = prefs.getUser();
        if (currentUser != null) {
            tvWelcome.setText("Welcome back, " + currentUser.getName() + "!");
        }

        btnLogGlucose.setOnClickListener(v -> {
            if (getActivity() instanceof MainActivity) {
                ((MainActivity) getActivity()).navigateToFragment(R.id.nav_add_reading);
            }
        });

        btnAiRecommendations.setOnClickListener(v -> {
            if (getActivity() instanceof MainActivity) {
                ((MainActivity) getActivity()).navigateToFragment(R.id.nav_ai_recs);
            }
        });

        view.findViewById(R.id.btn_card_chatbot).setOnClickListener(v -> {
            if (getActivity() instanceof MainActivity) {
                ((MainActivity) getActivity()).loadFragmentExternal(new ChatbotFragment(), "AI Chatbot");
            }
        });

        view.findViewById(R.id.btn_card_diet).setOnClickListener(v -> {
            if (getActivity() instanceof MainActivity) {
                ((MainActivity) getActivity()).loadFragmentExternal(new DietPlanFragment(), "AI Diet Plan");
            }
        });

        view.findViewById(R.id.btn_card_calculators).setOnClickListener(v -> {
            if (getActivity() instanceof MainActivity) {
                ((MainActivity) getActivity()).loadFragmentExternal(new CalculatorsFragment(), "Calculators");
            }
        });

        view.findViewById(R.id.btn_card_exercise).setOnClickListener(v -> {
            if (getActivity() instanceof MainActivity) {
                ((MainActivity) getActivity()).loadFragmentExternal(new ExercisePlannerFragment(), "Exercise Planner");
            }
        });

        view.findViewById(R.id.btn_card_water).setOnClickListener(v -> {
            if (getActivity() instanceof MainActivity) {
                ((MainActivity) getActivity()).loadFragmentExternal(new WaterTrackerFragment(), "Water Tracker");
            }
        });

        loadDashboardData();
        return view;
    }

    private void loadDashboardData() {
        if (prefs.isApiModeEnabled()) {
            loadFromBackendApi();
        } else {
            loadFromFirebase();
        }
    }

    private void loadFromBackendApi() {
        ApiService api = ApiClient.getApiService(requireContext());
        
        // Fetch Sugar History for average glucose and HbA1c
        api.getSugarHistory().enqueue(new Callback<ApiService.SugarHistoryResponse>() {
            @Override
            public void onResponse(Call<ApiService.SugarHistoryResponse> call, Response<ApiService.SugarHistoryResponse> response) {
                if (!isAdded() || getContext() == null) return;
                if (response.isSuccessful() && response.body() != null && response.body().success) {
                    calculateAndDisplayGlucoseStats(response.body().readings);
                }
            }
            @Override
            public void onFailure(Call<ApiService.SugarHistoryResponse> call, Throwable t) {
                if (!isAdded() || getContext() == null) return;
                Toast.makeText(getContext(), "Failed to sync readings: " + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });

        // Fetch AI Report details
        api.getAiReport().enqueue(new Callback<ApiService.AiReportResponse>() {
            @Override
            public void onResponse(Call<ApiService.AiReportResponse> call, Response<ApiService.AiReportResponse> response) {
                if (!isAdded() || getContext() == null) return;
                if (response.isSuccessful() && response.body() != null && response.body().success) {
                    displayAiReport(response.body().report);
                }
            }
            @Override
            public void onFailure(Call<ApiService.AiReportResponse> call, Throwable t) {
                // Ignore API warnings if user hasn't completed profile yet
            }
        });
    }

    private void loadFromFirebase() {
        User user = prefs.getUser();
        if (user == null) return;

        firebaseManager.fetchSugarHistory(user.getId(), new FirebaseManager.DataCallback<List<SugarReading>>() {
            @Override
            public void onSuccess(List<SugarReading> readings) {
                if (!isAdded() || getContext() == null) return;
                calculateAndDisplayGlucoseStats(readings);
                // Dynamically compile a mock report locally based on these values for direct Firebase mode
                compileLocalReport(readings);
            }

            @Override
            public void onFailure(String error) {
                if (!isAdded() || getContext() == null) return;
                Toast.makeText(getContext(), error, Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void calculateAndDisplayGlucoseStats(List<SugarReading> readings) {
        if (readings == null || readings.isEmpty()) {
            tvAvgGlucose.setText("—");
            tvHba1c.setText("—");
            return;
        }

        double sum = 0;
        for (SugarReading r : readings) {
            sum += r.getValue();
        }
        double avg = sum / readings.size();
        tvAvgGlucose.setText(String.format("%.0f mg/dL", avg));

        // HbA1c forecast: (avgGlucose + 46.7) / 28.7
        double forecastedHba1c = (avg + 46.7) / 28.7;
        tvHba1c.setText(String.format("%.1f%%", forecastedHba1c));
    }

    private void displayAiReport(AiReport report) {
        if (report == null) return;
        tvBmi.setText(String.format("%.1f (%s)", report.getBmi(), report.getBmiCategory()));
        tvCalorieTarget.setText(report.getCalorieTarget() + " kcal");
        tvHealthScore.setText(String.valueOf(report.getHealthScore()));
        tvRiskLevel.setText("Risk: " + report.getRiskLevel());
        tvTrendMessage.setText(report.getTrendMessage());
    }

    private void compileLocalReport(List<SugarReading> readings) {
        // Compile basic calculations offline in Firestore mode if backend is not queried
        User user = prefs.getUser();
        if (user == null) return;

        firebaseManager.fetchProfile(user.getId(), new FirebaseManager.DataCallback<Profile>() {
            @Override
            public void onSuccess(Profile profile) {
                if (!isAdded() || getContext() == null) return;
                double weight = profile.getWeight();
                double heightInM = profile.getHeight() / 100.0;
                double bmi = weight / (heightInM * heightInM);
                String bmiCat;
                if (bmi < 18.5) bmiCat = "Underweight";
                else if (bmi < 25) bmiCat = "Normal";
                else if (bmi < 30) bmiCat = "Overweight";
                else bmiCat = "Obese";

                tvBmi.setText(String.format(Locale.US, "%.1f (%s)", bmi, bmiCat));
                
                // Base Calories BMR (Mifflin-St Jeor)
                double bmr = (10 * weight) + (6.25 * profile.getHeight()) - (5 * profile.getAge());
                if ("male".equalsIgnoreCase(profile.getGender())) bmr += 5;
                else bmr -= 161;
                int caloriesTarget = (int) (bmr * 1.2 * 0.9);
                tvCalorieTarget.setText(caloriesTarget + " kcal");

                // Base Health score compilation
                int score = 100;
                if ("Obese".equals(bmiCat)) score -= 15;
                if (readings != null && !readings.isEmpty()) {
                    SugarReading latest = readings.get(0);
                    if (latest.getValue() > 180) {
                        score -= 20;
                        tvRiskLevel.setText("Risk: High");
                        tvTrendMessage.setText("Fasting or after-meal glucose levels show spikes. Monitor your carb intake.");
                    } else if (latest.getValue() > 120) {
                        score -= 10;
                        tvRiskLevel.setText("Risk: Medium");
                        tvTrendMessage.setText("Slightly elevated glucose levels. Consider walking 15 minutes post meals.");
                    } else {
                        tvRiskLevel.setText("Risk: Low");
                        tvTrendMessage.setText("Healthy glycemic response observed. Keep tracking daily.");
                    }
                } else {
                    tvRiskLevel.setText("Risk: Low");
                    tvTrendMessage.setText("Complete daily tracking logs to compile smart endocrinology diagnostics.");
                }
                tvHealthScore.setText(String.valueOf(score));
            }

            @Override
            public void onFailure(String error) {
                if (!isAdded() || getContext() == null) return;
                // Profile incomplete
                tvBmi.setText("Incomplete");
                tvCalorieTarget.setText("Incomplete");
                tvHealthScore.setText("75");
                tvRiskLevel.setText("Risk: Low");
                tvTrendMessage.setText("Please complete your profile to enable AI parameters calculations.");
            }
        });
    }
}
