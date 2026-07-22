package com.aidiabetes.app.fragments;

import android.content.res.ColorStateList;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.EditText;
import android.widget.ProgressBar;
import android.widget.Spinner;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import com.aidiabetes.app.R;
import com.aidiabetes.app.firebase.FirebaseManager;
import com.aidiabetes.app.models.Profile;
import com.aidiabetes.app.models.SugarReading;
import com.aidiabetes.app.models.User;
import com.aidiabetes.app.services.ApiClient;
import com.aidiabetes.app.services.ApiService;
import com.aidiabetes.app.utils.SharedPreferencesManager;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class CalculatorsFragment extends Fragment {

    private EditText etWeight, etHeight, etAge, etGlucose;
    private Spinner spinnerGender, spinnerActivity;
    private TextView tvBmi, tvBmiCat, tvBmr, tvHba1c, tvHba1cCat, tvTargetCalories, tvCarbs, tvProtein, tvFats;
    private ProgressBar progressHba1c;

    private SharedPreferencesManager prefs;
    private FirebaseManager firebaseManager;

    private final String[] genderOptions = {"Male", "Female"};
    private final String[] activityOptions = {
            "Sedentary (Little/No Exercise)",
            "Lightly Active (1-3 days/week)",
            "Moderately Active (3-5 days/week)",
            "Very Active (6-7 days/week)"
    };

    private boolean isUpdatingInputs = false;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_calculators, container, false);

        prefs = SharedPreferencesManager.getInstance(requireContext());
        firebaseManager = FirebaseManager.getInstance(requireContext());

        // Bind Views
        etWeight = view.findViewById(R.id.et_calc_weight);
        etHeight = view.findViewById(R.id.et_calc_height);
        etAge = view.findViewById(R.id.et_calc_age);
        etGlucose = view.findViewById(R.id.et_calc_glucose);

        spinnerGender = view.findViewById(R.id.spinner_calc_gender);
        spinnerActivity = view.findViewById(R.id.spinner_calc_activity);

        tvBmi = view.findViewById(R.id.tv_calc_bmi);
        tvBmiCat = view.findViewById(R.id.tv_calc_bmi_cat);
        tvBmr = view.findViewById(R.id.tv_calc_bmr);
        tvHba1c = view.findViewById(R.id.tv_calc_hba1c);
        tvHba1cCat = view.findViewById(R.id.tv_calc_hba1c_cat);
        tvTargetCalories = view.findViewById(R.id.tv_calc_target_calories);
        tvCarbs = view.findViewById(R.id.tv_calc_carb_grams);
        tvProtein = view.findViewById(R.id.tv_calc_protein_grams);
        tvFats = view.findViewById(R.id.tv_calc_fat_grams);
        progressHba1c = view.findViewById(R.id.progress_hba1c);

        setupSpinners();
        setupInputListeners();
        loadBiometrics();

        return view;
    }

    private void setupSpinners() {
        ArrayAdapter<String> genderAdapter = new ArrayAdapter<>(requireContext(),
                android.R.layout.simple_spinner_item, genderOptions);
        genderAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        spinnerGender.setAdapter(genderAdapter);

        ArrayAdapter<String> activityAdapter = new ArrayAdapter<>(requireContext(),
                android.R.layout.simple_spinner_item, activityOptions);
        activityAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        spinnerActivity.setAdapter(activityAdapter);
    }

    private void setupInputListeners() {
        TextWatcher recalculateWatcher = new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {}

            @Override
            public void afterTextChanged(Editable s) {
                if (!isUpdatingInputs) {
                    performCalculations();
                }
            }
        };

        etWeight.addTextChangedListener(recalculateWatcher);
        etHeight.addTextChangedListener(recalculateWatcher);
        etAge.addTextChangedListener(recalculateWatcher);
        etGlucose.addTextChangedListener(recalculateWatcher);

        AdapterView.OnItemSelectedListener spinnerListener = new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
                if (!isUpdatingInputs) {
                    performCalculations();
                }
            }

            @Override
            public void onNothingSelected(AdapterView<?> parent) {}
        };

        spinnerGender.setOnItemSelectedListener(spinnerListener);
        spinnerActivity.setOnItemSelectedListener(spinnerListener);
    }

    private void loadBiometrics() {
        isUpdatingInputs = true;

        if (prefs.isApiModeEnabled()) {
            ApiService api = ApiClient.getApiService(requireContext());
            
            // Get profile details
            api.getProfile().enqueue(new Callback<ApiService.ProfileResponse>() {
                @Override
                public void onResponse(Call<ApiService.ProfileResponse> call, Response<ApiService.ProfileResponse> response) {
                    if (!isAdded() || getContext() == null) return;
                    if (response.isSuccessful() && response.body() != null && response.body().success) {
                        applyProfileToInputs(response.body().profile);
                    }
                }

                @Override
                public void onFailure(Call<ApiService.ProfileResponse> call, Throwable t) {}
            });

            // Get average blood glucose estimation from readings history
            api.getSugarHistory().enqueue(new Callback<ApiService.SugarHistoryResponse>() {
                @Override
                public void onResponse(Call<ApiService.SugarHistoryResponse> call, Response<ApiService.SugarHistoryResponse> response) {
                    if (!isAdded() || getContext() == null) return;
                    if (response.isSuccessful() && response.body() != null && response.body().success) {
                        applyGlucoseToInput(response.body().readings);
                    }
                }

                @Override
                public void onFailure(Call<ApiService.SugarHistoryResponse> call, Throwable t) {}
            });

        } else {
            // Offline / Firebase mode
            User user = prefs.getUser();
            if (user != null) {
                firebaseManager.fetchProfile(user.getId(), new FirebaseManager.DataCallback<Profile>() {
                    @Override
                    public void onSuccess(Profile profile) {
                        if (!isAdded() || getContext() == null) return;
                        applyProfileToInputs(profile);
                    }

                    @Override
                    public void onFailure(String error) {}
                });

                firebaseManager.fetchSugarHistory(user.getId(), new FirebaseManager.DataCallback<List<SugarReading>>() {
                    @Override
                    public void onSuccess(List<SugarReading> readings) {
                        if (!isAdded() || getContext() == null) return;
                        applyGlucoseToInput(readings);
                    }

                    @Override
                    public void onFailure(String error) {}
                });
            }
        }
    }

    private void applyProfileToInputs(Profile profile) {
        if (profile == null) return;
        isUpdatingInputs = true;
        
        etWeight.setText(String.valueOf(profile.getWeight()));
        etHeight.setText(String.valueOf(profile.getHeight()));
        etAge.setText(String.valueOf(profile.getAge()));

        // Set gender spinner
        if ("female".equalsIgnoreCase(profile.getGender())) {
            spinnerGender.setSelection(1);
        } else {
            spinnerGender.setSelection(0);
        }

        // Set activity level spinner
        String level = profile.getActivityLevel();
        if (level != null) {
            if (level.contains("Sedentary")) {
                spinnerActivity.setSelection(0);
            } else if (level.contains("Lightly")) {
                spinnerActivity.setSelection(1);
            } else if (level.contains("Moderately")) {
                spinnerActivity.setSelection(2);
            } else if (level.contains("Very")) {
                spinnerActivity.setSelection(3);
            }
        }

        isUpdatingInputs = false;
        performCalculations();
    }

    private void applyGlucoseToInput(List<SugarReading> readings) {
        if (readings == null || readings.isEmpty()) return;
        isUpdatingInputs = true;
        
        double sum = 0;
        for (SugarReading r : readings) {
            sum += r.getValue();
        }
        int avg = (int) Math.round(sum / readings.size());
        etGlucose.setText(String.valueOf(avg));

        isUpdatingInputs = false;
        performCalculations();
    }

    private void performCalculations() {
        if (!isAdded() || getContext() == null) return;
        String weightStr = etWeight.getText().toString().trim();
        String heightStr = etHeight.getText().toString().trim();
        String ageStr = etAge.getText().toString().trim();
        String glucoseStr = etGlucose.getText().toString().trim();

        if (weightStr.isEmpty() || heightStr.isEmpty() || ageStr.isEmpty() || glucoseStr.isEmpty()) {
            return;
        }

        double weight, height, avgGlucose;
        int age;
        try {
            weight = Double.parseDouble(weightStr);
            height = Double.parseDouble(heightStr);
            age = Integer.parseInt(ageStr);
            avgGlucose = Double.parseDouble(glucoseStr);
        } catch (NumberFormatException e) {
            // Guard parsing errors silently or reset targets
            return;
        }

        // 1. BMI Calculation
        double heightInM = height / 100.0;
        double bmiVal = heightInM > 0 ? (weight / (heightInM * heightInM)) : 0.0;
        tvBmi.setText(String.format(Locale.US, "%.1f", bmiVal));

        if (bmiVal < 18.5) {
            tvBmiCat.setText("Underweight");
            tvBmiCat.setTextColor(androidx.core.content.ContextCompat.getColor(getContext(), android.R.color.holo_blue_dark));
        } else if (bmiVal < 25.0) {
            tvBmiCat.setText("Normal Weight");
            tvBmiCat.setTextColor(androidx.core.content.ContextCompat.getColor(getContext(), R.color.risk_low));
        } else if (bmiVal < 30.0) {
            tvBmiCat.setText("Overweight");
            tvBmiCat.setTextColor(androidx.core.content.ContextCompat.getColor(getContext(), R.color.risk_medium));
        } else {
            tvBmiCat.setText("Obese");
            tvBmiCat.setTextColor(androidx.core.content.ContextCompat.getColor(getContext(), R.color.risk_high));
        }

        // 2. BMR (Mifflin-St Jeor)
        double bmrVal;
        boolean isMale = spinnerGender.getSelectedItemPosition() == 0;
        if (isMale) {
            bmrVal = (10 * weight) + (6.25 * height) - (5 * age) + 5;
        } else {
            bmrVal = (10 * weight) + (6.25 * height) - (5 * age) - 161;
        }
        tvBmr.setText(String.format("%.0f kcal", bmrVal));

        // 3. TDEE
        double multiplier = 1.2;
        int activityPos = spinnerActivity.getSelectedItemPosition();
        switch (activityPos) {
            case 1: multiplier = 1.375; break;
            case 2: multiplier = 1.55; break;
            case 3: multiplier = 1.725; break;
        }
        double tdee = bmrVal * multiplier;

        // 4. Target Calories (-500 for weight loss/deficit)
        int targetCalories = (int) Math.round(tdee - 500);
        if (targetCalories < 1200) targetCalories = 1200; // minimum safe floor calorie intake
        tvTargetCalories.setText(String.valueOf(targetCalories));

        // Macros splits: Carbs 40%, Protein 30%, Fats 30%
        int carbG = (int) Math.round((targetCalories * 0.40) / 4.0);
        int proteinG = (int) Math.round((targetCalories * 0.30) / 4.0);
        int fatG = (int) Math.round((targetCalories * 0.30) / 9.0);

        tvCarbs.setText(carbG + "g");
        tvProtein.setText(proteinG + "g");
        tvFats.setText(fatG + "g");

        // 5. Estimated HbA1c
        double hba1cVal = (avgGlucose + 46.7) / 28.7;
        tvHba1c.setText(String.format(Locale.US, "%.1f%%", hba1cVal));

        int progress = (int) Math.round((hba1cVal / 14.0) * 100.0);
        progressHba1c.setProgress(Math.min(100, progress));

        if (hba1cVal < 5.7) {
            tvHba1cCat.setText("Normal");
            tvHba1cCat.setTextColor(androidx.core.content.ContextCompat.getColor(getContext(), R.color.risk_low));
            progressHba1c.setProgressTintList(ColorStateList.valueOf(androidx.core.content.ContextCompat.getColor(getContext(), R.color.risk_low)));
        } else if (hba1cVal < 6.5) {
            tvHba1cCat.setText("Prediabetic");
            tvHba1cCat.setTextColor(androidx.core.content.ContextCompat.getColor(getContext(), R.color.risk_medium));
            progressHba1c.setProgressTintList(ColorStateList.valueOf(androidx.core.content.ContextCompat.getColor(getContext(), R.color.risk_medium)));
        } else {
            tvHba1cCat.setText("Diabetic Range");
            tvHba1cCat.setTextColor(androidx.core.content.ContextCompat.getColor(getContext(), R.color.risk_high));
            progressHba1c.setProgressTintList(ColorStateList.valueOf(androidx.core.content.ContextCompat.getColor(getContext(), R.color.risk_high)));
        }
    }
}
