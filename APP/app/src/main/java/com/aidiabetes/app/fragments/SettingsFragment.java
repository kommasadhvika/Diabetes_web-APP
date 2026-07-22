package com.aidiabetes.app.fragments;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Switch;
import android.widget.TextView;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import com.aidiabetes.app.R;
import com.aidiabetes.app.activities.MainActivity;
import com.aidiabetes.app.firebase.FirebaseManager;
import com.aidiabetes.app.services.ApiClient;
import com.aidiabetes.app.utils.SharedPreferencesManager;

public class SettingsFragment extends Fragment {

    private Switch switchApiMode;
    private EditText etServerUrl;
    private TextView tvFirebaseStatus;
    private Button btnSaveSettings, btnLogout;

    private SharedPreferencesManager prefs;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_settings, container, false);

        prefs = SharedPreferencesManager.getInstance(requireContext());

        switchApiMode = view.findViewById(R.id.switch_api_mode);
        etServerUrl = view.findViewById(R.id.et_server_url);
        tvFirebaseStatus = view.findViewById(R.id.tv_firebase_status);
        btnSaveSettings = view.findViewById(R.id.btn_save_settings);
        btnLogout = view.findViewById(R.id.btn_logout);

        // Load current config
        switchApiMode.setChecked(prefs.isApiModeEnabled());
        etServerUrl.setText(prefs.getServerUrl());

        boolean isFirebaseMocked = FirebaseManager.getInstance(requireContext()).isMocked();
        tvFirebaseStatus.setText("Firebase Status: " + (isFirebaseMocked ? "Developer Sandbox Mock Mode" : "Cloud Native Connected"));

        btnSaveSettings.setOnClickListener(v -> saveSettings());
        btnLogout.setOnClickListener(v -> {
            if (getActivity() instanceof MainActivity) {
                ((MainActivity) getActivity()).logoutUser();
            }
        });

        return view;
    }

    private void saveSettings() {
        boolean apiEnabled = switchApiMode.isChecked();
        String url = etServerUrl.getText().toString().trim();

        if (url.isEmpty()) {
            Toast.makeText(getContext(), "Server URL cannot be empty", Toast.LENGTH_SHORT).show();
            return;
        }

        if (!url.endsWith("/")) {
            url += "/";
        }

        prefs.setApiModeEnabled(apiEnabled);
        prefs.setServerUrl(url);
        
        // Reset client so it rebuilds Retrofit instance with new URL configuration
        ApiClient.resetClient();

        Toast.makeText(getContext(), "Settings saved successfully!", Toast.LENGTH_SHORT).show();
    }
}
