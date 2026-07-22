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

public class RegisterActivity extends AppCompatActivity {

    private EditText etName, etEmail, etPassword, etPhone;
    private Button btnRegister;
    private TextView tvLoginLink;
    private ProgressBar progressBar;

    private SharedPreferencesManager prefs;
    private FirebaseManager firebaseManager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_register);

        prefs = SharedPreferencesManager.getInstance(this);
        firebaseManager = FirebaseManager.getInstance(this);

        etName = findViewById(R.id.et_name);
        etEmail = findViewById(R.id.et_email);
        etPassword = findViewById(R.id.et_password);
        etPhone = findViewById(R.id.et_phone);
        btnRegister = findViewById(R.id.btn_register);
        tvLoginLink = findViewById(R.id.tv_login_link);
        progressBar = findViewById(R.id.progress_bar);

        btnRegister.setOnClickListener(v -> handleRegistration());
        tvLoginLink.setOnClickListener(v -> finish());
    }

    private void handleRegistration() {
        String name = etName.getText().toString().trim();
        String email = etEmail.getText().toString().trim();
        String password = etPassword.getText().toString().trim();
        String phone = etPhone.getText().toString().trim();

        if (name.isEmpty() || email.isEmpty() || password.isEmpty() || phone.isEmpty()) {
            Toast.makeText(this, R.string.err_empty_fields, Toast.LENGTH_SHORT).show();
            return;
        }

        if (password.length() < 6) {
            Toast.makeText(this, R.string.err_short_password, Toast.LENGTH_SHORT).show();
            return;
        }

        progressBar.setVisibility(View.VISIBLE);
        btnRegister.setEnabled(false);

        if (prefs.isApiModeEnabled()) {
            // REST API registration route
            ApiService api = ApiClient.getApiService(this);
            api.signup(new ApiService.SignupRequest(name, email, password, phone)).enqueue(new Callback<ApiService.AuthResponse>() {
                @Override
                public void onResponse(Call<ApiService.AuthResponse> call, Response<ApiService.AuthResponse> response) {
                    progressBar.setVisibility(View.GONE);
                    btnRegister.setEnabled(true);

                    if (response.isSuccessful() && response.body() != null && response.body().success) {
                        Toast.makeText(RegisterActivity.this, "Signup successful! OTP sent to your email.", Toast.LENGTH_LONG).show();
                        showOtpDialog(email);
                    } else {
                        String msg = "Signup failed";
                        if (response.body() != null) msg = response.body().message;
                        Toast.makeText(RegisterActivity.this, msg, Toast.LENGTH_LONG).show();
                    }
                }

                @Override
                public void onFailure(Call<ApiService.AuthResponse> call, Throwable t) {
                    progressBar.setVisibility(View.GONE);
                    btnRegister.setEnabled(true);
                    Toast.makeText(RegisterActivity.this, "Network error: " + t.getMessage(), Toast.LENGTH_LONG).show();
                }
            });
        } else {
            // Direct Firebase route
            firebaseManager.register(name, email, password, phone, new FirebaseManager.AuthCallback() {
                @Override
                public void onSuccess(User user) {
                    progressBar.setVisibility(View.GONE);
                    btnRegister.setEnabled(true);
                    Toast.makeText(RegisterActivity.this, "Signup successful! Logging you in...", Toast.LENGTH_SHORT).show();
                    
                    // Session caching for direct mode
                    prefs.saveToken("firebase_authenticated_token_" + user.getId());
                    prefs.saveUser(user);
                    
                    // Save last login timestamp
                    SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
                    sdf.setTimeZone(TimeZone.getTimeZone("UTC"));
                    prefs.saveLastLoginTimestamp(sdf.format(new Date()));

                    Intent intent = new Intent(RegisterActivity.this, MainActivity.class);
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                    startActivity(intent);
                    finish();
                }

                @Override
                public void onFailure(String error) {
                    progressBar.setVisibility(View.GONE);
                    btnRegister.setEnabled(true);
                    Toast.makeText(RegisterActivity.this, error, Toast.LENGTH_LONG).show();
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
            ApiService api = ApiClient.getApiService(RegisterActivity.this);
            api.resendOtp(new ApiService.OtpRequest(email, "")).enqueue(new Callback<ApiService.GenericResponse>() {
                @Override
                public void onResponse(Call<ApiService.GenericResponse> call, Response<ApiService.GenericResponse> response) {
                    Toast.makeText(RegisterActivity.this, "OTP resent to your email", Toast.LENGTH_SHORT).show();
                }
                @Override
                public void onFailure(Call<ApiService.GenericResponse> call, Throwable t) {
                    Toast.makeText(RegisterActivity.this, "Resend failed", Toast.LENGTH_SHORT).show();
                }
            });
        });

        final AlertDialog dialog = builder.create();
        dialog.show();

        dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener(v -> {
            String otp = input.getText().toString().trim();
            if (otp.isEmpty() || otp.length() < 6) {
                Toast.makeText(RegisterActivity.this, "Please enter a valid 6-digit OTP", Toast.LENGTH_SHORT).show();
                return;
            }

            progressBar.setVisibility(View.VISIBLE);
            dialog.dismiss();

            ApiService api = ApiClient.getApiService(RegisterActivity.this);
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

                        Toast.makeText(RegisterActivity.this, "Account verified! Welcome " + authData.user.getName(), Toast.LENGTH_SHORT).show();
                        
                        Intent intent = new Intent(RegisterActivity.this, MainActivity.class);
                        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                        startActivity(intent);
                        finish();
                    } else {
                        String msg = "Verification failed";
                        if (response.body() != null) msg = response.body().message;
                        Toast.makeText(RegisterActivity.this, msg, Toast.LENGTH_LONG).show();
                        showOtpDialog(email); // reopen dialog
                    }
                }

                @Override
                public void onFailure(Call<ApiService.AuthResponse> call, Throwable t) {
                    progressBar.setVisibility(View.GONE);
                    Toast.makeText(RegisterActivity.this, "Network error: " + t.getMessage(), Toast.LENGTH_LONG).show();
                    showOtpDialog(email); // reopen dialog
                }
            });
        });
    }
}
