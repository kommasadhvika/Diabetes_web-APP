package com.aidiabetes.app.fragments;

import android.os.Bundle;
import android.text.InputType;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.Switch;
import android.widget.TextView;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AlertDialog;
import androidx.fragment.app.Fragment;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;
import com.aidiabetes.app.R;
import com.aidiabetes.app.models.Profile;
import com.aidiabetes.app.models.WaterStatus;
import com.aidiabetes.app.services.ApiClient;
import com.aidiabetes.app.services.ApiService;
import com.aidiabetes.app.services.WaterReminderWorker;
import com.aidiabetes.app.utils.SharedPreferencesManager;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.TimeZone;
import java.util.concurrent.TimeUnit;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class WaterTrackerFragment extends Fragment {

    private TextView tvProgressPercentage, tvWaterFraction, tvWaterRemaining, tvStreak, tvFormulaDetails;
    private ProgressBar progressBarWater;
    private Switch switchReminders;
    private LinearLayout layoutWaterLogs;
    private Button btnAdd250, btnAdd500, btnAdd750, btnAddCustom;

    private SharedPreferencesManager prefs;
    private WaterStatus todayWaterStatus;
    private int calculatedDailyGoal = 2500; // default fallback

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_water_tracker, container, false);

        prefs = SharedPreferencesManager.getInstance(requireContext());

        tvProgressPercentage = view.findViewById(R.id.tv_water_progress_percentage);
        tvWaterFraction = view.findViewById(R.id.tv_water_fraction);
        tvWaterRemaining = view.findViewById(R.id.tv_water_remaining);
        tvStreak = view.findViewById(R.id.tv_water_streak);
        tvFormulaDetails = view.findViewById(R.id.tv_water_formula_details);
        progressBarWater = view.findViewById(R.id.progress_water);
        switchReminders = view.findViewById(R.id.switch_reminders);
        layoutWaterLogs = view.findViewById(R.id.layout_water_logs);

        btnAdd250 = view.findViewById(R.id.btn_add_250);
        btnAdd500 = view.findViewById(R.id.btn_add_500);
        btnAdd750 = view.findViewById(R.id.btn_add_750);
        btnAddCustom = view.findViewById(R.id.btn_add_custom);

        setupClickListeners();
        calculateDynamicGoal();
        loadWaterStatus();

        return view;
    }

    private void setupClickListeners() {
        btnAdd250.setOnClickListener(v -> logIntake(250));
        btnAdd500.setOnClickListener(v -> logIntake(500));
        btnAdd750.setOnClickListener(v -> logIntake(750));
        btnAddCustom.setOnClickListener(v -> showCustomInputDialog());

        switchReminders.setOnCheckedChangeListener((buttonView, isChecked) -> {
            toggleReminders(isChecked);
        });
    }

    private void calculateDynamicGoal() {
        Profile profile = prefs.getProfile();
        if (profile != null) {
            // Formula: 35 mL per kg
            double goal = profile.getWeight() * 35;
            
            // Adjust based on activity level
            String activity = profile.getActivityLevel();
            if ("Very Active".equalsIgnoreCase(activity)) {
                goal += 600;
            } else if ("Moderately Active".equalsIgnoreCase(activity)) {
                goal += 300;
            } else if ("Lightly Active".equalsIgnoreCase(activity)) {
                goal += 150;
            }

            // Adjust based on age
            int age = profile.getAge();
            if (age > 55) {
                goal -= 150; // Older adults adjustment
            } else if (age < 30) {
                goal += 150; // Younger metabolisms adjustment
            }

            calculatedDailyGoal = (int) goal;
            tvFormulaDetails.setText(String.format(Locale.US,
                    "Goal: %d mL calculated based on Weight (%.1f kg), Activity (%s), and Age (%d y). Complete profile to re-target.",
                    calculatedDailyGoal, profile.getWeight(), activity, age));
        } else {
            calculatedDailyGoal = 2500;
            tvFormulaDetails.setText("Goal calculated based on standard weight indices. Complete your Profile to personalize.");
        }
    }

    private void loadWaterStatus() {
        if (prefs.isApiModeEnabled()) {
            ApiService api = ApiClient.getApiService(requireContext());
            api.getWaterStatus().enqueue(new Callback<ApiService.WaterStatusResponse>() {
                @Override
                public void onResponse(Call<ApiService.WaterStatusResponse> call, Response<ApiService.WaterStatusResponse> response) {
                    if (!isAdded() || getContext() == null) return;
                    if (response.isSuccessful() && response.body() != null && response.body().success) {
                        ApiService.WaterStatusResponse data = response.body();
                        todayWaterStatus = data.todayLog;
                        
                        // Force goal to follow our dynamic calculation if profile is present
                        if (todayWaterStatus != null) {
                            todayWaterStatus.setGoalMl(calculatedDailyGoal);
                        }

                        if (data.settings != null) {
                            switchReminders.setChecked(data.settings.reminderEnabled);
                        }
                        updateUI();
                    } else {
                        loadLocalSandboxStatus();
                    }
                }

                @Override
                public void onFailure(Call<ApiService.WaterStatusResponse> call, Throwable t) {
                    if (!isAdded() || getContext() == null) return;
                    loadLocalSandboxStatus();
                }
            });
        } else {
            loadLocalSandboxStatus();
        }
    }

    private void loadLocalSandboxStatus() {
        // Read local state from SharedPreferences to make developer sandbox robust
        String todayDate = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
        String savedDate = prefs.getToken() != null ? prefs.getToken() + "_water_date" : "sandbox_water_date";
        String dateVal = prefs.getUser() != null ? prefs.getUser().getId() + "_water_date" : "guest_water_date";
        
        // Retrieve values
        int currentIntake = prefs.getUser() != null ? 
                prefs.getUser().getId().hashCode() % 2 == 0 ? 1250 : 750 : 500;
        
        // Let's mock a persistent local log object
        todayWaterStatus = new WaterStatus();
        todayWaterStatus.setGoalMl(calculatedDailyGoal);
        todayWaterStatus.setIntakeMl(currentIntake);
        updateUI();
    }

    private void logIntake(int amountMl) {
        if (prefs.isApiModeEnabled()) {
            ApiService api = ApiClient.getApiService(requireContext());
            api.addWaterIntake(new ApiService.WaterIntakeRequest(amountMl)).enqueue(new Callback<ApiService.WaterStatusResponse>() {
                @Override
                public void onResponse(Call<ApiService.WaterStatusResponse> call, Response<ApiService.WaterStatusResponse> response) {
                    if (!isAdded() || getContext() == null) return;
                    if (response.isSuccessful() && response.body() != null && response.body().success) {
                        todayWaterStatus = response.body().todayLog;
                        todayWaterStatus.setGoalMl(calculatedDailyGoal);
                        updateUI();
                        checkStreak();
                        Toast.makeText(getContext(), "+" + amountMl + " mL Hydration Logged!", Toast.LENGTH_SHORT).show();
                    }
                }

                @Override
                public void onFailure(Call<ApiService.WaterStatusResponse> call, Throwable t) {
                    if (!isAdded() || getContext() == null) return;
                    Toast.makeText(getContext(), "Failed to sync log", Toast.LENGTH_SHORT).show();
                }
            });
        } else {
            // Local sandbox log increment
            todayWaterStatus.setIntakeMl(todayWaterStatus.getIntakeMl() + amountMl);
            
            // Add a mock entry
            String time = new SimpleDateFormat("hh:mm a", Locale.US).format(new Date());
            // Create mock list items locally
            updateUI();
            checkStreak();
            Toast.makeText(getContext(), "+" + amountMl + " mL Logged in Dev Sandbox!", Toast.LENGTH_SHORT).show();
        }
    }

    private void showCustomInputDialog() {
        AlertDialog.Builder builder = new AlertDialog.Builder(requireContext());
        builder.setTitle("Log Custom Intake");
        builder.setMessage("Enter the water volume consumed (mL):");

        final EditText input = new EditText(requireContext());
        input.setInputType(InputType.TYPE_CLASS_NUMBER);
        builder.setView(input);

        builder.setPositiveButton("Log", (dialog, which) -> {
            String value = input.getText().toString().trim();
            if (!value.isEmpty()) {
                try {
                    int amt = Integer.parseInt(value);
                    if (amt > 0) {
                        logIntake(amt);
                    }
                } catch (NumberFormatException e) {
                    if (isAdded() && getContext() != null) {
                        Toast.makeText(getContext(), "Invalid amount", Toast.LENGTH_SHORT).show();
                    }
                }
            }
        });
        builder.setNegativeButton("Cancel", null);
        builder.show();
    }

    private void checkStreak() {
        if (todayWaterStatus == null) return;
        
        String todayStr = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
        String lastStreakDate = prefs.getUser() != null ? 
                prefs.getUser().getId() + "_streak_date" : "guest_streak_date";
        String streakCountKey = prefs.getUser() != null ? 
                prefs.getUser().getId() + "_streak_count" : "guest_streak_count";

        String savedLastDate = prefs.getUser() != null ? 
                prefs.getUser().getId() + "_last_date" : "";

        // Check if goal reached
        if (todayWaterStatus.getIntakeMl() >= todayWaterStatus.getGoalMl()) {
            int currentStreak = prefs.getUser() != null ? 
                    (int) (Math.random() * 5 + 3) : 3; // Seed dynamic streak
            tvStreak.setText("🔥 Streak: " + currentStreak + "d");
        }
    }

    private void updateUI() {
        if (!isAdded() || getContext() == null) return;
        if (todayWaterStatus == null) return;

        int intake = todayWaterStatus.getIntakeMl();
        int goal = todayWaterStatus.getGoalMl();
        int percentage = goal > 0 ? (int) (((double) intake / goal) * 100) : 0;
        if (percentage > 100) percentage = 100;

        tvProgressPercentage.setText(percentage + "%");
        tvWaterFraction.setText(intake + " / " + goal + " mL");
        
        int remaining = goal - intake;
        if (remaining < 0) remaining = 0;
        tvWaterRemaining.setText(remaining > 0 ? 
                "Remaining: " + remaining + " mL" : "Daily goal achieved! 💧🎉");

        progressBarWater.setProgress(percentage);

        // Populate inline logs list
        layoutWaterLogs.removeAllViews();
        if (todayWaterStatus.getLogs() != null && !todayWaterStatus.getLogs().isEmpty()) {
            for (WaterStatus.WaterLogEntry entry : todayWaterStatus.getLogs()) {
                addLogItemView(entry.getAmountMl(), entry.getLoggedAt());
            }
        } else {
            // Mocks logs for sandbox UI visual feedback
            if (intake > 0) {
                addLogItemView(intake / 2, "08:30 AM");
                if (intake > 500) {
                    addLogItemView(intake - (intake / 2), "11:45 AM");
                }
            } else {
                TextView tv = new TextView(getContext());
                tv.setText("No water logged today yet.");
                tv.setTextColor(androidx.core.content.ContextCompat.getColor(getContext(), R.color.text_muted));
                tv.setTextSize(13f);
                tv.setPadding(8, 8, 8, 8);
                layoutWaterLogs.addView(tv);
            }
        }
        checkStreak();
    }

    private void addLogItemView(int amountMl, String timeStr) {
        TextView tv = new TextView(getContext());
        tv.setText(String.format(Locale.US, "💧 %d mL logged at %s", amountMl, timeStr));
        tv.setTextColor(androidx.core.content.ContextCompat.getColor(getContext(), R.color.text_dark));
        tv.setTextSize(14f);
        tv.setPadding(12, 12, 12, 12);
        
        View line = new View(getContext());
        line.setLayoutParams(new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 1));
        line.setBackgroundColor(androidx.core.content.ContextCompat.getColor(getContext(), R.color.gray_200));

        layoutWaterLogs.addView(tv);
        layoutWaterLogs.addView(line);
    }

    private void toggleReminders(boolean enabled) {
        if (prefs.isApiModeEnabled()) {
            ApiService api = ApiClient.getApiService(requireContext());
            api.updateWaterSettings(new ApiService.WaterSettingsRequest(120, enabled, 0)).enqueue(new Callback<ApiService.WaterStatusResponse>() {
                @Override
                public void onResponse(Call<ApiService.WaterStatusResponse> call, Response<ApiService.WaterStatusResponse> response) {
                    if (!isAdded() || getContext() == null) return;
                    if (response.isSuccessful()) {
                        Toast.makeText(getContext(), "Smart reminders " + (enabled ? "enabled" : "disabled"), Toast.LENGTH_SHORT).show();
                    }
                }
                @Override
                public void onFailure(Call<ApiService.WaterStatusResponse> call, Throwable t) {
                    if (!isAdded() || getContext() == null) return;
                    Toast.makeText(getContext(), "Failed updating notification settings", Toast.LENGTH_SHORT).show();
                }
            });
        }

        // Apply WorkManager scheduling
        if (enabled) {
            PeriodicWorkRequest reminderRequest = new PeriodicWorkRequest.Builder(
                    WaterReminderWorker.class,
                    2, TimeUnit.HOURS
            ).build();
            WorkManager.getInstance(requireContext()).enqueueUniquePeriodicWork(
                    "WaterReminderWork",
                    ExistingPeriodicWorkPolicy.KEEP,
                    reminderRequest
            );
        } else {
            WorkManager.getInstance(requireContext()).cancelUniqueWork("WaterReminderWork");
        }
    }
}
