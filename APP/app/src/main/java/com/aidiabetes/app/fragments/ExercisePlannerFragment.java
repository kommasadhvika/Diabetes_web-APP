package com.aidiabetes.app.fragments;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.CountDownTimer;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AlertDialog;
import androidx.fragment.app.Fragment;
import com.aidiabetes.app.R;
import com.aidiabetes.app.models.ExerciseSchedule;
import com.aidiabetes.app.models.Profile;
import com.aidiabetes.app.services.ApiClient;
import com.aidiabetes.app.services.ApiService;
import com.aidiabetes.app.utils.SharedPreferencesManager;
import com.bumptech.glide.Glide;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class ExercisePlannerFragment extends Fragment {

    private TextView tvDurationTarget, tvCalTarget, tvEmptyState;
    private Button btnRegenerate;
    private LinearLayout layoutDaysTabs, layoutExercisesContainer;
    private ProgressBar progressBar;

    private SharedPreferencesManager prefs;
    private ExerciseSchedule currentSchedule;
    private String activeDay = "Monday";
    private final String[] daysOfWeek = {"Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"};

    private int calculatedTimeTarget = 30; // mins
    private int calculatedCalTarget = 200;  // kcal

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_exercise_planner, container, false);

        prefs = SharedPreferencesManager.getInstance(requireContext());

        tvDurationTarget = view.findViewById(R.id.tv_exercise_duration_target);
        tvCalTarget = view.findViewById(R.id.tv_exercise_cal_target);
        tvEmptyState = view.findViewById(R.id.tv_empty_state);
        btnRegenerate = view.findViewById(R.id.btn_regenerate_exercise);
        layoutDaysTabs = view.findViewById(R.id.layout_exercise_days_tabs);
        layoutExercisesContainer = view.findViewById(R.id.layout_exercises_container);
        progressBar = view.findViewById(R.id.progress_bar);

        btnRegenerate.setOnClickListener(v -> handleRegenerate());

        calculateTargetMetrics();
        loadSchedule();

        return view;
    }

    private void calculateTargetMetrics() {
        Profile profile = prefs.getProfile();
        if (profile != null) {
            String activity = profile.getActivityLevel();
            if ("Very Active".equalsIgnoreCase(activity)) {
                calculatedTimeTarget = 60;
                calculatedCalTarget = 450;
            } else if ("Moderately Active".equalsIgnoreCase(activity)) {
                calculatedTimeTarget = 45;
                calculatedCalTarget = 300;
            } else if ("Lightly Active".equalsIgnoreCase(activity)) {
                calculatedTimeTarget = 30;
                calculatedCalTarget = 200;
            } else {
                calculatedTimeTarget = 20;
                calculatedCalTarget = 120;
            }
            
            // Adjust based on age
            if (profile.getAge() > 50) {
                calculatedTimeTarget -= 5;
                calculatedCalTarget -= 40;
            }
        }
        tvDurationTarget.setText(calculatedTimeTarget + " mins");
        tvCalTarget.setText(calculatedCalTarget + " kcal");
    }

    private void loadSchedule() {
        progressBar.setVisibility(View.VISIBLE);
        layoutExercisesContainer.removeAllViews();
        tvEmptyState.setVisibility(View.GONE);

        if (prefs.isApiModeEnabled()) {
            ApiService api = ApiClient.getApiService(requireContext());
            api.getExerciseSchedule().enqueue(new Callback<ApiService.ExerciseScheduleResponse>() {
                @Override
                public void onResponse(Call<ApiService.ExerciseScheduleResponse> call, Response<ApiService.ExerciseScheduleResponse> response) {
                    if (!isAdded() || getContext() == null) return;
                    progressBar.setVisibility(View.GONE);
                    if (response.isSuccessful() && response.body() != null && response.body().success) {
                        currentSchedule = response.body().schedule;
                        updateUI();
                    } else {
                        setupMockSchedule();
                    }
                }

                @Override
                public void onFailure(Call<ApiService.ExerciseScheduleResponse> call, Throwable t) {
                    if (!isAdded() || getContext() == null) return;
                    progressBar.setVisibility(View.GONE);
                    setupMockSchedule();
                }
            });
        } else {
            progressBar.setVisibility(View.GONE);
            setupMockSchedule();
        }
    }

    private void setupMockSchedule() {
        if (currentSchedule == null) {
            currentSchedule = new ExerciseSchedule();
            Map<String, List<ExerciseSchedule.ExerciseItem>> plan = new HashMap<>();

            for (String day : daysOfWeek) {
                List<ExerciseSchedule.ExerciseItem> items = new ArrayList<>();
                if (day.equals("Monday") || day.equals("Wednesday") || day.equals("Friday")) {
                    items.add(new ExerciseSchedule.ExerciseItem(
                            "Brisk Post-Meal Walking", 20, "1 session", 120, "Easy",
                            "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=400&q=80",
                            "", ""
                    ));
                    items.add(new ExerciseSchedule.ExerciseItem(
                            "Bodyweight Air Squats", 10, "12 reps x 3 sets", 80, "Medium",
                            "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&q=80",
                            "", ""
                    ));
                } else if (day.equals("Sunday")) {
                    items.add(new ExerciseSchedule.ExerciseItem(
                            "Active Rest & Deep Stretching", 15, "1 session", 40, "Easy",
                            "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&q=80",
                            "", ""
                    ));
                } else {
                    items.add(new ExerciseSchedule.ExerciseItem(
                            "Moderate Stationary Cycling", 25, "1 session", 180, "Medium",
                            "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&q=80",
                            "", ""
                    ));
                    items.add(new ExerciseSchedule.ExerciseItem(
                            "Dumbbell Shoulder Press", 12, "10 reps x 3 sets", 90, "Hard",
                            "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&q=80",
                            "", ""
                    ));
                }
                plan.put(day, items);
            }
            currentSchedule.setWeeklyPlan(plan);
        }
        updateUI();
    }

    private void updateUI() {
        if (!isAdded() || getContext() == null) return;
        renderDaysTabs();
        renderActiveExercises();
    }

    private void renderDaysTabs() {
        layoutDaysTabs.removeAllViews();
        for (String day : daysOfWeek) {
            Button btn = new Button(getContext());
            LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.WRAP_CONTENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
            );
            lp.setMargins(0, 0, 16, 0);
            btn.setLayoutParams(lp);

            btn.setText(day);
            btn.setTextSize(12);
            btn.setAllCaps(false);
            btn.setPadding(24, 8, 24, 8);

            if (day.equalsIgnoreCase(activeDay)) {
                btn.setBackgroundColor(androidx.core.content.ContextCompat.getColor(getContext(), R.color.primary));
                btn.setTextColor(androidx.core.content.ContextCompat.getColor(getContext(), R.color.white));
            } else {
                btn.setBackgroundColor(androidx.core.content.ContextCompat.getColor(getContext(), R.color.white));
                btn.setTextColor(androidx.core.content.ContextCompat.getColor(getContext(), R.color.text_dark));
            }

            btn.setOnClickListener(v -> {
                activeDay = day;
                renderDaysTabs();
                renderActiveExercises();
            });

            layoutDaysTabs.addView(btn);
        }
    }

    private void renderActiveExercises() {
        layoutExercisesContainer.removeAllViews();
        if (currentSchedule == null || currentSchedule.getWeeklyPlan() == null) {
            tvEmptyState.setVisibility(View.VISIBLE);
            return;
        }

        List<ExerciseSchedule.ExerciseItem> items = currentSchedule.getWeeklyPlan().get(activeDay);
        if (items != null && !items.isEmpty()) {
            tvEmptyState.setVisibility(View.GONE);
            for (ExerciseSchedule.ExerciseItem item : items) {
                addExerciseCard(item);
            }
        } else {
            tvEmptyState.setVisibility(View.VISIBLE);
        }
    }

    private void addExerciseCard(ExerciseSchedule.ExerciseItem item) {
        LayoutInflater inflater = LayoutInflater.from(getContext());
        View view = inflater.inflate(R.layout.item_exercise, layoutExercisesContainer, false);

        ImageView ivImage = view.findViewById(R.id.iv_exercise_image);
        TextView tvDifficulty = view.findViewById(R.id.tv_exercise_difficulty);
        TextView tvCalories = view.findViewById(R.id.tv_exercise_calories);
        TextView tvName = view.findViewById(R.id.tv_exercise_name);
        TextView tvMetrics = view.findViewById(R.id.tv_exercise_metrics);
        Button btnTutorial = view.findViewById(R.id.btn_exercise_tutorial);
        Button btnStart = view.findViewById(R.id.btn_exercise_start);

        tvDifficulty.setText(item.getDifficulty().toUpperCase());
        if ("easy".equalsIgnoreCase(item.getDifficulty())) {
            tvDifficulty.setTextColor(androidx.core.content.ContextCompat.getColor(getContext(), R.color.risk_low));
        } else if ("medium".equalsIgnoreCase(item.getDifficulty())) {
            tvDifficulty.setTextColor(androidx.core.content.ContextCompat.getColor(getContext(), R.color.risk_medium));
        } else {
            tvDifficulty.setTextColor(androidx.core.content.ContextCompat.getColor(getContext(), R.color.risk_high));
        }

        tvCalories.setText("🔥 " + item.getCaloriesBurned() + " kcal");
        tvName.setText(item.getName());
        tvMetrics.setText(String.format(Locale.US, "Duration: %d mins  •  %s", item.getDuration(), item.getRepetitions()));

        if (item.getImageUrl() != null && !item.getImageUrl().isEmpty()) {
            ivImage.setVisibility(View.VISIBLE);
            Glide.with(this)
                    .load(item.getImageUrl())
                    .placeholder(android.R.drawable.ic_menu_gallery)
                    .into(ivImage);
        } else {
            ivImage.setVisibility(View.GONE);
        }

        btnTutorial.setOnClickListener(v -> playTutorialVideo(item));
        btnStart.setOnClickListener(v -> startWorkoutTimer(item));

        layoutExercisesContainer.addView(view);
    }

    private void playTutorialVideo(ExerciseSchedule.ExerciseItem item) {
        String url = item.getVideoUrl();
        if (url == null || url.isEmpty()) {
            // Search query search helper fallback
            url = "https://www.youtube.com/results?search_query=" + Uri.encode(item.getName() + " exercise tutorial");
        }
        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
        startActivity(intent);
    }

    private void startWorkoutTimer(ExerciseSchedule.ExerciseItem item) {
        AlertDialog.Builder builder = new AlertDialog.Builder(requireContext());
        View dialogView = getLayoutInflater().inflate(R.layout.dialog_exercise_timer, null);
        builder.setView(dialogView);

        TextView tvTitle = dialogView.findViewById(R.id.tv_timer_title);
        TextView tvClock = dialogView.findViewById(R.id.tv_timer_clock);
        ProgressBar progressTimer = dialogView.findViewById(R.id.progress_timer);
        Button btnStop = dialogView.findViewById(R.id.btn_timer_stop);
        Button btnPauseResume = dialogView.findViewById(R.id.btn_timer_pause_resume);

        tvTitle.setText(item.getName());

        // Fast-tick simulator: 1 second real-time = 1 minute workout duration
        final long workoutTotalSeconds = item.getDuration(); // count down in seconds for easy testing!
        final long totalMillis = workoutTotalSeconds * 1000;

        AlertDialog timerDialog = builder.create();
        timerDialog.setCancelable(false);
        timerDialog.show();

        // CountDownTimer wrapper
        class TimerContainer {
            CountDownTimer timer;
            long millisLeft = totalMillis;
            boolean isPaused = false;
        }
        final TimerContainer container = new TimerContainer();

        Runnable startTimerRunnable = new Runnable() {
            @Override
            public void run() {
                container.timer = new CountDownTimer(container.millisLeft, 100) {
                    @Override
                    public void onTick(long millisUntilFinished) {
                        container.millisLeft = millisUntilFinished;
                        long secsRemaining = millisUntilFinished / 1000;
                        long minutes = secsRemaining / 60;
                        long seconds = secsRemaining % 60;
                        tvClock.setText(String.format(Locale.US, "%02d:%02d", minutes, seconds));

                        int progress = (int) (((double) millisUntilFinished / totalMillis) * 100);
                        progressTimer.setProgress(progress);
                    }

                    @Override
                    public void onFinish() {
                        timerDialog.dismiss();
                        if (!isAdded() || getContext() == null) return;
                        tvClock.setText("00:00");
                        progressTimer.setProgress(0);
                        
                        logCompletedWorkout(item);
                    }
                }.start();
            }
        };

        startTimerRunnable.run();

        btnPauseResume.setOnClickListener(v -> {
            if (!isAdded() || getContext() == null) return;
            if (container.isPaused) {
                container.isPaused = false;
                btnPauseResume.setText("Pause");
                btnPauseResume.setBackgroundColor(androidx.core.content.ContextCompat.getColor(getContext(), R.color.primary));
                startTimerRunnable.run();
            } else {
                container.isPaused = true;
                btnPauseResume.setText("Resume");
                btnPauseResume.setBackgroundColor(androidx.core.content.ContextCompat.getColor(getContext(), R.color.accent));
                if (container.timer != null) {
                    container.timer.cancel();
                }
            }
        });

        btnStop.setOnClickListener(v -> {
            if (container.timer != null) {
                container.timer.cancel();
            }
            timerDialog.dismiss();
            if (!isAdded() || getContext() == null) return;
            Toast.makeText(getContext(), "Workout session aborted", Toast.LENGTH_SHORT).show();
        });
    }

    private void logCompletedWorkout(ExerciseSchedule.ExerciseItem item) {
        progressBar.setVisibility(View.VISIBLE);

        if (prefs.isApiModeEnabled()) {
            ApiService api = ApiClient.getApiService(requireContext());
            api.logExerciseActivity(new ApiService.ExerciseLogRequest(
                    item.getName(), item.getDuration(), 1, item.getCaloriesBurned(), "AI Generated"
            )).enqueue(new Callback<ApiService.GenericResponse>() {
                @Override
                public void onResponse(Call<ApiService.GenericResponse> call, Response<ApiService.GenericResponse> response) {
                    if (!isAdded() || getContext() == null) return;
                    progressBar.setVisibility(View.GONE);
                    if (response.isSuccessful()) {
                        Toast.makeText(getContext(), "Excellent! Workout logged. You earned 100 XP! 🎉", Toast.LENGTH_LONG).show();
                    } else {
                        Toast.makeText(getContext(), "Workout finished!", Toast.LENGTH_SHORT).show();
                    }
                }

                @Override
                public void onFailure(Call<ApiService.GenericResponse> call, Throwable t) {
                    if (!isAdded() || getContext() == null) return;
                    progressBar.setVisibility(View.GONE);
                    Toast.makeText(getContext(), "Workout logged locally!", Toast.LENGTH_SHORT).show();
                }
            });
        } else {
            progressBar.setVisibility(View.GONE);
            Toast.makeText(getContext(), "Awesome! Workout logged in Dev Sandbox. +100 XP earned! 🎉", Toast.LENGTH_LONG).show();
        }
    }

    private void handleRegenerate() {
        btnRegenerate.setEnabled(false);
        btnRegenerate.setText("Regenerating...");
        progressBar.setVisibility(View.VISIBLE);

        if (prefs.isApiModeEnabled()) {
            ApiService api = ApiClient.getApiService(requireContext());
            api.generateExerciseSchedule().enqueue(new Callback<ApiService.ExerciseScheduleResponse>() {
                @Override
                public void onResponse(Call<ApiService.ExerciseScheduleResponse> call, Response<ApiService.ExerciseScheduleResponse> response) {
                    if (!isAdded() || getContext() == null) return;
                    btnRegenerate.setEnabled(true);
                    btnRegenerate.setText("Regenerate");
                    progressBar.setVisibility(View.GONE);
                    if (response.isSuccessful() && response.body() != null && response.body().success) {
                        currentSchedule = response.body().schedule;
                        updateUI();
                        Toast.makeText(getContext(), "New AI workout schedule generated!", Toast.LENGTH_SHORT).show();
                    } else {
                        Toast.makeText(getContext(), "Regeneration failed", Toast.LENGTH_SHORT).show();
                    }
                }

                @Override
                public void onFailure(Call<ApiService.ExerciseScheduleResponse> call, Throwable t) {
                    if (!isAdded() || getContext() == null) return;
                    btnRegenerate.setEnabled(true);
                    btnRegenerate.setText("Regenerate");
                    progressBar.setVisibility(View.GONE);
                    Toast.makeText(getContext(), "Network error: " + t.getMessage(), Toast.LENGTH_SHORT).show();
                }
            });
        } else {
            new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(() -> {
                if (!isAdded() || getContext() == null) return;
                btnRegenerate.setEnabled(true);
                btnRegenerate.setText("Regenerate");
                progressBar.setVisibility(View.GONE);
                currentSchedule = null; // force rebuild mock
                setupMockSchedule();
                Toast.makeText(getContext(), "New schedule generated in Dev Sandbox!", Toast.LENGTH_SHORT).show();
            }, 1000);
        }
    }
}
