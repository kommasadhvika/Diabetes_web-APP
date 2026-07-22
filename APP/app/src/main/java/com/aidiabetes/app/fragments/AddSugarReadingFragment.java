package com.aidiabetes.app.fragments;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.EditText;
import android.widget.RadioGroup;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import com.aidiabetes.app.R;
import com.aidiabetes.app.activities.MainActivity;
import com.aidiabetes.app.firebase.FirebaseManager;
import com.aidiabetes.app.models.SugarReading;
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

public class AddSugarReadingFragment extends Fragment {

    private EditText etValue, etNotes;
    private RadioGroup rgType;
    private Button btnSave;
    private SharedPreferencesManager prefs;
    private FirebaseManager firebaseManager;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_add_sugar, container, false);

        prefs = SharedPreferencesManager.getInstance(requireContext());
        firebaseManager = FirebaseManager.getInstance(requireContext());

        etValue = view.findViewById(R.id.et_sugar_value);
        etNotes = view.findViewById(R.id.et_sugar_notes);
        rgType = view.findViewById(R.id.rg_reading_type);
        btnSave = view.findViewById(R.id.btn_save_reading);

        btnSave.setOnClickListener(v -> saveReading());

        return view;
    }

    private void saveReading() {
        String valStr = etValue.getText().toString().trim();
        String notes = etNotes.getText().toString().trim();

        if (valStr.isEmpty()) {
            if (isAdded() && getContext() != null) {
                Toast.makeText(getContext(), "Please enter a glucose value", Toast.LENGTH_SHORT).show();
            }
            return;
        }

        double val;
        try {
            val = Double.parseDouble(valStr);
        } catch (NumberFormatException e) {
            if (isAdded() && getContext() != null) {
                Toast.makeText(getContext(), "Please enter a valid numeric value for glucose", Toast.LENGTH_SHORT).show();
            }
            return;
        }
        String type;
        int checkedId = rgType.getCheckedRadioButtonId();
        
        if (checkedId == R.id.rb_fasting) {
            type = "fasting";
        } else if (checkedId == R.id.rb_after_meal) {
            type = "afterMeal";
        } else {
            type = "random";
        }

        // Apply local business logic classification (mirrors backend's classifySugarLevel in aiService.js)
        String classification;
        String riskLevel;
        if ("fasting".equals(type)) {
            if (val < 100) {
                classification = "NORMAL";
                riskLevel = "Low";
            } else if (val <= 125) {
                classification = "PREDIABETIC";
                riskLevel = "Medium";
            } else {
                classification = "HIGH DIABETES RISK";
                riskLevel = "High";
            }
        } else {
            if (val < 140) {
                classification = "NORMAL";
                riskLevel = "Low";
            } else if (val <= 199) {
                classification = "PREDIABETIC";
                riskLevel = "Medium";
            } else {
                classification = "HIGH DIABETES RISK";
                riskLevel = "High";
            }
        }

        // Create standard ISO Date
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
        sdf.setTimeZone(TimeZone.getTimeZone("UTC"));
        String timestamp = sdf.format(new Date());

        SugarReading reading = new SugarReading(null, null, type, val, classification, riskLevel, notes, timestamp);

        btnSave.setEnabled(false);

        if (prefs.isApiModeEnabled()) {
            // REST API save endpoint
            ApiService api = ApiClient.getApiService(requireContext());
            api.addSugarReading(reading).enqueue(new Callback<ApiService.SugarReadingResponse>() {
                @Override
                public void onResponse(Call<ApiService.SugarReadingResponse> call, Response<ApiService.SugarReadingResponse> response) {
                    if (!isAdded() || getContext() == null) return;
                    btnSave.setEnabled(true);
                    if (response.isSuccessful() && response.body() != null && response.body().success) {
                        Toast.makeText(getContext(), "Reading synced to server!", Toast.LENGTH_SHORT).show();
                        clearInputsAndNavigateBack();
                    } else {
                        Toast.makeText(getContext(), "Sync failed: " + (response.body() != null ? response.body().message : "Unknown error"), Toast.LENGTH_LONG).show();
                    }
                }

                @Override
                public void onFailure(Call<ApiService.SugarReadingResponse> call, Throwable t) {
                    if (!isAdded() || getContext() == null) return;
                    btnSave.setEnabled(true);
                    Toast.makeText(getContext(), "Network error: " + t.getMessage(), Toast.LENGTH_LONG).show();
                }
            });
        } else {
            // Direct Firebase save endpoint
            firebaseManager.saveSugarReading(reading, new FirebaseManager.OperationCallback() {
                @Override
                public void onSuccess() {
                    if (!isAdded() || getContext() == null) return;
                    btnSave.setEnabled(true);
                    Toast.makeText(getContext(), "Reading saved to Firebase Firestore!", Toast.LENGTH_SHORT).show();
                    clearInputsAndNavigateBack();
                }

                @Override
                public void onFailure(String error) {
                    if (!isAdded() || getContext() == null) return;
                    btnSave.setEnabled(true);
                    Toast.makeText(getContext(), "Firestore error: " + error, Toast.LENGTH_LONG).show();
                }
            });
        }
    }

    private void clearInputsAndNavigateBack() {
        etValue.setText("");
        etNotes.setText("");
        rgType.check(R.id.rb_fasting);
        
        if (getActivity() instanceof MainActivity) {
            ((MainActivity) getActivity()).navigateToFragment(R.id.nav_dashboard);
        }
    }
}
