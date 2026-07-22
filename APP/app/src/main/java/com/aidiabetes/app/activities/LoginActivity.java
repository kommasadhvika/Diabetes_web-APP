package com.aidiabetes.app.activities;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
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

public class LoginActivity extends AppCompatActivity {

    private EditText etEmail, etPassword;
    private Button btnLogin;
    private TextView tvRegisterLink;
    private ProgressBar progressBar;
    
    private SharedPreferencesManager prefs;
    private FirebaseManager firebaseManager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);

        prefs = SharedPreferencesManager.getInstance(this);
        firebaseManager = FirebaseManager.getInstance(this);

        // Check active session
        if (prefs.getToken() != null || (firebaseManager.isMocked() && prefs.getUser() != null)) {
            navigateToMain();
            return;
        }

        etEmail = findViewById(R.id.et_email);
        etPassword = findViewById(R.id.et_password);
        btnLogin = findViewById(R.id.btn_login);
        tvRegisterLink = findViewById(R.id.tv_register_link);
        progressBar = findViewById(R.id.progress_bar);

        btnLogin.setOnClickListener(v -> handleLogin());
        tvRegisterLink.setOnClickListener(v -> {
            startActivity(new Intent(LoginActivity.this, RegisterActivity.class));
        });
    }

    private void handleLogin() {
        String email = etEmail.getText().toString().trim();
        String password = etPassword.getText().toString().trim();

        if (email.isEmpty() || password.isEmpty()) {
            Toast.makeText(this, R.string.err_empty_fields, Toast.LENGTH_SHORT).show();
            return;
        }

        progressBar.setVisibility(View.VISIBLE);
        btnLogin.setEnabled(false);

        if (prefs.isApiModeEnabled()) {
            // REST API authentication route
            ApiService api = ApiClient.getApiService(this);
            api.login(new ApiService.LoginRequest(email, password)).enqueue(new Callback<ApiService.AuthResponse>() {
                @Override
                public void onResponse(Call<ApiService.AuthResponse> call, Response<ApiService.AuthResponse> response) {
                    progressBar.setVisibility(View.GONE);
                    btnLogin.setEnabled(true);
                    
                    if (response.isSuccessful() && response.body() != null && response.body().success) {
                        ApiService.AuthResponse authData = response.body();
                        prefs.saveToken(authData.token);
                        prefs.saveUser(authData.user);
                        
                        // Save last login timestamp
                        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
                        sdf.setTimeZone(TimeZone.getTimeZone("UTC"));
                        prefs.saveLastLoginTimestamp(sdf.format(new Date()));

                        // Fetch and save Profile if completed
                        if (authData.user.isProfileCompleted()) {
                            api.getProfile().enqueue(new Callback<ApiService.ProfileResponse>() {
                                @Override
                                public void onResponse(Call<ApiService.ProfileResponse> call, Response<ApiService.ProfileResponse> res) {
                                    if (res.isSuccessful() && res.body() != null && res.body().success) {
                                        prefs.saveProfile(res.body().profile);
                                    }
                                    Toast.makeText(LoginActivity.this, "Welcome " + authData.user.getName(), Toast.LENGTH_SHORT).show();
                                    navigateToMain();
                                }

                                @Override
                                public void onFailure(Call<ApiService.ProfileResponse> call, Throwable t) {
                                    Toast.makeText(LoginActivity.this, "Welcome " + authData.user.getName(), Toast.LENGTH_SHORT).show();
                                    navigateToMain();
                                }
                            });
                        } else {
                            Toast.makeText(LoginActivity.this, "Welcome " + authData.user.getName(), Toast.LENGTH_SHORT).show();
                            navigateToMain();
                        }
                    } else if (response.code() == 403 || (response.body() != null && !response.body().success && "Your account is not verified. Please verify your email first.".equals(response.body().message))) {
                        showOtpDialog(email);
                    } else {
                        String msg = "Login failed";
                        if (response.body() != null) msg = response.body().message;
                        Toast.makeText(LoginActivity.this, msg, Toast.LENGTH_LONG).show();
                    }
                }

                @Override
                public void onFailure(Call<ApiService.AuthResponse> call, Throwable t) {
                    progressBar.setVisibility(View.GONE);
                    btnLogin.setEnabled(true);
                    Toast.makeText(LoginActivity.this, "Network error: " + t.getMessage(), Toast.LENGTH_LONG).show();
                }
            });
        } else {
            // Direct Firebase route
            firebaseManager.login(email, password, new FirebaseManager.AuthCallback() {
                @Override
                public void onSuccess(User user) {
                    progressBar.setVisibility(View.GONE);
                    btnLogin.setEnabled(true);
                    prefs.saveToken("firebase_authenticated_token_" + user.getId());
                    prefs.saveUser(user);
                    
                    // Save last login timestamp
                    SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
                    sdf.setTimeZone(TimeZone.getTimeZone("UTC"));
                    prefs.saveLastLoginTimestamp(sdf.format(new Date()));

                    // Fetch and save Profile if completed
                    if (user.isProfileCompleted()) {
                        firebaseManager.fetchProfile(user.getId(), new FirebaseManager.DataCallback<Profile>() {
                            @Override
                            public void onSuccess(Profile profile) {
                                prefs.saveProfile(profile);
                                Toast.makeText(LoginActivity.this, "Welcome " + user.getName(), Toast.LENGTH_SHORT).show();
                                navigateToMain();
                            }

                            @Override
                            public void onFailure(String error) {
                                Toast.makeText(LoginActivity.this, "Welcome " + user.getName(), Toast.LENGTH_SHORT).show();
                                navigateToMain();
                            }
                        });
                    } else {
                        Toast.makeText(LoginActivity.this, "Welcome " + user.getName(), Toast.LENGTH_SHORT).show();
                        navigateToMain();
                    }
                }

                @Override
                public void onFailure(String error) {
                    progressBar.setVisibility(View.GONE);
                    btnLogin.setEnabled(true);
                    Toast.makeText(LoginActivity.this, error, Toast.LENGTH_LONG).show();
                }
            });
        }
    }

    private void showOtpDialog(final String email) {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle("Verify Account");
        builder.setMessage("Enter the 6-digit OTP code sent to your email:");
        
        final EditText input = new EditText(this);
        input.setInputType(android.text.InputType.TYPE_CLASS_NUMBER);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.MATCH_PARENT);
        input.setLayoutParams(lp);
        builder.setView(input);

        builder.setPositiveButton("Verify", null);
        builder.setNegativeButton("Resend OTP", (dialog, which) -> {
            ApiService api = ApiClient.getApiService(LoginActivity.this);
            api.resendOtp(new ApiService.OtpRequest(email, "")).enqueue(new Callback<ApiService.GenericResponse>() {
                @Override
                public void onResponse(Call<ApiService.GenericResponse> call, Response<ApiService.GenericResponse> response) {
                    Toast.makeText(LoginActivity.this, "OTP resent to your email", Toast.LENGTH_SHORT).show();
                }
                @Override
                public void onFailure(Call<ApiService.GenericResponse> call, Throwable t) {
                    Toast.makeText(LoginActivity.this, "Resend failed", Toast.LENGTH_SHORT).show();
                }
            });
        });

        final AlertDialog dialog = builder.create();
        dialog.show();

        dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener(v -> {
            String otp = input.getText().toString().trim();
            if (otp.isEmpty() || otp.length() < 6) {
                Toast.makeText(LoginActivity.this, "Please enter a valid 6-digit OTP", Toast.LENGTH_SHORT).show();
                return;
            }

            progressBar.setVisibility(View.VISIBLE);
            dialog.dismiss();

            ApiService api = ApiClient.getApiService(LoginActivity.this);
            api.verifyOtp(new ApiService.OtpRequest(email, otp)).enqueue(new Callback<ApiService.AuthResponse>() {
                @Override
                public void onResponse(Call<ApiService.AuthResponse> call, Response<ApiService.AuthResponse> response) {
                    progressBar.setVisibility(View.GONE);
                    if (response.isSuccessful() && response.body() != null && response.body().success) {
                        ApiService.AuthResponse authData = response.body();
                        prefs.saveToken(authData.token);
                        prefs.saveUser(authData.user);
                        
                        // Save last login timestamp
                        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
                        sdf.setTimeZone(TimeZone.getTimeZone("UTC"));
                        prefs.saveLastLoginTimestamp(sdf.format(new Date()));

                        Toast.makeText(LoginActivity.this, "Account verified! Welcome " + authData.user.getName(), Toast.LENGTH_SHORT).show();
                        navigateToMain();
                    } else {
                        String msg = "Verification failed";
                        if (response.body() != null) msg = response.body().message;
                        Toast.makeText(LoginActivity.this, msg, Toast.LENGTH_LONG).show();
                        showOtpDialog(email); // reopen dialog
                    }
                }

                @Override
                public void onFailure(Call<ApiService.AuthResponse> call, Throwable t) {
                    progressBar.setVisibility(View.GONE);
                    Toast.makeText(LoginActivity.this, "Network error: " + t.getMessage(), Toast.LENGTH_LONG).show();
                    showOtpDialog(email); // reopen dialog
                }
            });
        });
    }

    private void navigateToMain() {
        startActivity(new Intent(LoginActivity.this, MainActivity.class));
        finish();
    }
}
