package com.aidiabetes.app.activities;

import android.content.Intent;
import android.os.Bundle;
import android.view.MenuItem;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentManager;
import com.aidiabetes.app.R;
import com.aidiabetes.app.firebase.FirebaseManager;
import com.aidiabetes.app.fragments.AddSugarReadingFragment;
import com.aidiabetes.app.fragments.AiRecommendationFragment;
import com.aidiabetes.app.fragments.DashboardFragment;
import com.aidiabetes.app.fragments.HistoryFragment;
import com.aidiabetes.app.fragments.ProfileFragment;
import com.aidiabetes.app.fragments.SettingsFragment;
import com.aidiabetes.app.utils.SharedPreferencesManager;
import com.google.android.material.bottomnavigation.BottomNavigationView;
import com.google.android.material.navigation.NavigationBarView;

public class MainActivity extends AppCompatActivity {

    private TextView tvTitle;
    private BottomNavigationView bottomNav;
    private SharedPreferencesManager prefs;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        prefs = SharedPreferencesManager.getInstance(this);

        tvTitle = findViewById(R.id.tv_app_title);
        bottomNav = findViewById(R.id.bottom_navigation);

        bottomNav.setOnItemSelectedListener(new NavigationBarView.OnItemSelectedListener() {
            @Override
            public boolean onNavigationItemSelected(@NonNull MenuItem item) {
                Fragment selectedFragment = null;
                int itemId = item.getItemId();
                
                if (itemId == R.id.nav_dashboard) {
                    selectedFragment = new DashboardFragment();
                    tvTitle.setText(R.string.title_dashboard);
                } else if (itemId == R.id.nav_add_reading) {
                    selectedFragment = new AddSugarReadingFragment();
                    tvTitle.setText(R.string.title_add_reading);
                } else if (itemId == R.id.nav_history) {
                    selectedFragment = new HistoryFragment();
                    tvTitle.setText(R.string.title_history);
                } else if (itemId == R.id.nav_ai_recs) {
                    selectedFragment = new AiRecommendationFragment();
                    tvTitle.setText(R.string.title_ai_recs);
                } else if (itemId == R.id.nav_profile) {
                    selectedFragment = new ProfileFragment();
                    tvTitle.setText(R.string.title_profile);
                }

                if (selectedFragment != null) {
                    loadFragment(selectedFragment);
                    return true;
                }
                return false;
            }
        });

        findViewById(R.id.btn_settings_header).setOnClickListener(v -> {
            loadFragment(new SettingsFragment());
            tvTitle.setText(R.string.title_settings);
        });

        // Set default fragment
        if (savedInstanceState == null) {
            bottomNav.setSelectedItemId(R.id.nav_dashboard);
        }
    }

    private void loadFragment(Fragment fragment) {
        FragmentManager fragmentManager = getSupportFragmentManager();
        fragmentManager.beginTransaction()
                .replace(R.id.fragment_container, fragment)
                .commit();
    }

    public void loadFragmentExternal(Fragment fragment, String title) {
        loadFragment(fragment);
        tvTitle.setText(title);
    }

    public void navigateToFragment(int navItemId) {
        bottomNav.setSelectedItemId(navItemId);
    }

    public void logoutUser() {
        // Clear session caches
        prefs.clearSession();
        FirebaseManager.getInstance(this).logout();

        // Redirect to Login
        Intent intent = new Intent(MainActivity.this, LoginActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
    }
}
