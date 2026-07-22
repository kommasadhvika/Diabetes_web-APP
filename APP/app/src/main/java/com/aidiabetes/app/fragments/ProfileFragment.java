package com.aidiabetes.app.fragments;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ProgressBar;
import android.widget.Spinner;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import com.aidiabetes.app.R;
import com.aidiabetes.app.firebase.FirebaseManager;
import com.aidiabetes.app.models.Profile;
import com.aidiabetes.app.models.User;
import com.aidiabetes.app.services.ApiClient;
import com.aidiabetes.app.services.ApiService;
import com.aidiabetes.app.utils.SharedPreferencesManager;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class ProfileFragment extends Fragment {

    private EditText etFullName, etAge, etHeight, etWeight, etNotes;
    private Spinner spinnerGender, spinnerDiabetesType, spinnerActivityLevel;
    private Button btnSave;
    private ProgressBar progressBar;

    private SharedPreferencesManager prefs;
    private FirebaseManager firebaseManager;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_profile, container, false);

        prefs = SharedPreferencesManager.getInstance(requireContext());
        firebaseManager = FirebaseManager.getInstance(requireContext());

        etFullName = view.findViewById(R.id.et_profile_name);
        etAge = view.findViewById(R.id.et_profile_age);
        etHeight = view.findViewById(R.id.et_profile_height);
        etWeight = view.findViewById(R.id.et_profile_weight);
        etNotes = view.findViewById(R.id.et_profile_notes);
        
        spinnerGender = view.findViewById(R.id.spinner_gender);
        spinnerDiabetesType = view.findViewById(R.id.spinner_diabetes_type);
        spinnerActivityLevel = view.findViewById(R.id.spinner_activity);
        
        btnSave = view.findViewById(R.id.btn_save_profile);
        progressBar = view.findViewById(R.id.progress_bar);

        setupSpinners();
        loadProfile();

        btnSave.setOnClickListener(v -> saveProfile());

        return view;
    }

    private void setupSpinners() {
        String[] genders = {"Male", "Female", "Other"};
        spinnerGender.setAdapter(new ArrayAdapter<>(getContext(), android.R.layout.simple_spinner_dropdown_item, genders));

        String[] types = {"Type 1", "Type 2", "Gestational", "Prediabetes"};
        spinnerDiabetesType.setAdapter(new ArrayAdapter<>(getContext(), android.R.layout.simple_spinner_dropdown_item, types));

        String[] activities = {"Sedentary", "Lightly Active", "Moderately Active", "Very Active"};
        spinnerActivityLevel.setAdapter(new ArrayAdapter<>(getContext(), android.R.layout.simple_spinner_dropdown_item, activities));
    }

    private void loadProfile() {
        User user = prefs.getUser();
        if (user == null) return;

        progressBar.setVisibility(View.VISIBLE);
        btnSave.setEnabled(false);

        if (prefs.isApiModeEnabled()) {
            ApiService api = ApiClient.getApiService(requireContext());
            api.getProfile().enqueue(new Callback<ApiService.ProfileResponse>() {
                @Override
                public void onResponse(Call<ApiService.ProfileResponse> call, Response<ApiService.ProfileResponse> response) {
                    if (!isAdded() || getContext() == null) return;
                    progressBar.setVisibility(View.GONE);
                    btnSave.setEnabled(true);
                    if (response.isSuccessful() && response.body() != null && response.body().success) {
                        populateForm(response.body().profile);
                    } else {
                        // Pre-populate with user name if profile doesn't exist yet
                        etFullName.setText(user.getName());
                    }
                }

                @Override
                public void onFailure(Call<ApiService.ProfileResponse> call, Throwable t) {
                    if (!isAdded() || getContext() == null) return;
                    progressBar.setVisibility(View.GONE);
                    btnSave.setEnabled(true);
                    etFullName.setText(user.getName());
                }
            });
        } else {
            firebaseManager.fetchProfile(user.getId(), new FirebaseManager.DataCallback<Profile>() {
                @Override
                public void onSuccess(Profile profile) {
                    if (!isAdded() || getContext() == null) return;
                    progressBar.setVisibility(View.GONE);
                    btnSave.setEnabled(true);
                    populateForm(profile);
                }

                @Override
                public void onFailure(String error) {
                    if (!isAdded() || getContext() == null) return;
                    progressBar.setVisibility(View.GONE);
                    btnSave.setEnabled(true);
                    etFullName.setText(user.getName());
                }
            });
        }
    }

    private void populateForm(Profile profile) {
        if (profile == null) return;
        etFullName.setText(profile.getFullName());
        etAge.setText(String.valueOf(profile.getAge()));
        etHeight.setText(String.valueOf(profile.getHeight()));
        etWeight.setText(String.valueOf(profile.getWeight()));
        etNotes.setText(profile.getMedicalNotes());

        selectSpinnerItem(spinnerGender, profile.getGender());
        selectSpinnerItem(spinnerDiabetesType, profile.getDiabetesType());
        selectSpinnerItem(spinnerActivityLevel, profile.getActivityLevel());
    }

    private void selectSpinnerItem(Spinner spinner, String value) {
        if (value == null) return;
        for (int i = 0; i < spinner.getCount(); i++) {
            if (spinner.getItemAtPosition(i).toString().equalsIgnoreCase(value)) {
                spinner.setSelection(i);
                break;
            }
        }
    }

    private void saveProfile() {
        User user = prefs.getUser();
        if (user == null) return;

        String name = etFullName.getText().toString().trim();
        String ageStr = etAge.getText().toString().trim();
        String heightStr = etHeight.getText().toString().trim();
        String weightStr = etWeight.getText().toString().trim();
        String notes = etNotes.getText().toString().trim();

        if (name.isEmpty() || ageStr.isEmpty() || heightStr.isEmpty() || weightStr.isEmpty()) {
            if (isAdded() && getContext() != null) {
                Toast.makeText(getContext(), R.string.err_empty_fields, Toast.LENGTH_SHORT).show();
            }
            return;
        }

        int age;
        float height;
        float weight;
        try {
            age = Integer.parseInt(ageStr);
            height = Float.parseFloat(heightStr);
            weight = Float.parseFloat(weightStr);
        } catch (NumberFormatException e) {
            if (isAdded() && getContext() != null) {
                Toast.makeText(getContext(), "Please enter valid numbers for age, height, and weight", Toast.LENGTH_SHORT).show();
            }
            return;
        }

        progressBar.setVisibility(View.VISIBLE);
        btnSave.setEnabled(false);

        String gender = spinnerGender.getSelectedItem().toString();
        String diabetesType = spinnerDiabetesType.getSelectedItem().toString();
        String activity = spinnerActivityLevel.getSelectedItem().toString();

        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
        sdf.setTimeZone(TimeZone.getTimeZone("UTC"));
        String timestamp = sdf.format(new Date());

        Profile profile = new Profile(user.getId(), name, age, gender, height, weight, diabetesType, activity, notes, timestamp);

        if (prefs.isApiModeEnabled()) {
            ApiService api = ApiClient.getApiService(requireContext());
            api.updateProfile(profile).enqueue(new Callback<ApiService.ProfileResponse>() {
                @Override
                public void onResponse(Call<ApiService.ProfileResponse> call, Response<ApiService.ProfileResponse> response) {
                    if (!isAdded() || getContext() == null) return;
                    progressBar.setVisibility(View.GONE);
                    btnSave.setEnabled(true);
                    if (response.isSuccessful() && response.body() != null && response.body().success) {
                        user.setProfileCompleted(true);
                        prefs.saveUser(user);
                        Toast.makeText(getContext(), "Profile updated successfully!", Toast.LENGTH_SHORT).show();
                    } else {
                        Toast.makeText(getContext(), "Failed: " + (response.body() != null ? response.body().message : "Server error"), Toast.LENGTH_LONG).show();
                    }
                }

                @Override
                public void onFailure(Call<ApiService.ProfileResponse> call, Throwable t) {
                    if (!isAdded() || getContext() == null) return;
                    progressBar.setVisibility(View.GONE);
                    btnSave.setEnabled(true);
                    Toast.makeText(getContext(), "Network error: " + t.getMessage(), Toast.LENGTH_LONG).show();
                }
            });
        } else {
            firebaseManager.saveProfile(profile, new FirebaseManager.OperationCallback() {
                @Override
                public void onSuccess() {
                    if (!isAdded() || getContext() == null) return;
                    progressBar.setVisibility(View.GONE);
                    btnSave.setEnabled(true);
                    user.setProfileCompleted(true);
                    prefs.saveUser(user);
                    Toast.makeText(getContext(), "Profile saved successfully on Firebase!", Toast.LENGTH_SHORT).show();
                }

                @Override
                public void onFailure(String error) {
                    if (!isAdded() || getContext() == null) return;
                    progressBar.setVisibility(View.GONE);
                    btnSave.setEnabled(true);
                    Toast.makeText(getContext(), "Firebase error: " + error, Toast.LENGTH_LONG).show();
                }
            });
        }
    }
}
