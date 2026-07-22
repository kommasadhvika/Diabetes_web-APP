package com.aidiabetes.app.utils;

import android.content.Context;
import android.content.SharedPreferences;
import com.aidiabetes.app.models.Profile;
import com.aidiabetes.app.models.User;
import com.google.gson.Gson;

public class SharedPreferencesManager {
    private static final String PREF_NAME = "ai_diabetes_prefs";
    private static final String KEY_TOKEN = "jwt_token";
    private static final String KEY_USER = "user_json";
    private static final String KEY_PROFILE = "profile_json";
    private static final String KEY_LAST_LOGIN = "last_login_timestamp";
    private static final String KEY_API_MODE = "api_mode_enabled"; // false = Direct Firebase, true = API Backend
    private static final String KEY_SERVER_URL = "server_url";

    private static SharedPreferencesManager instance;
    private final SharedPreferences sharedPreferences;
    private final Gson gson;

    private SharedPreferencesManager(Context context) {
        sharedPreferences = context.getApplicationContext().getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        gson = new Gson();
    }

    public static synchronized SharedPreferencesManager getInstance(Context context) {
        if (instance == null) {
            instance = new SharedPreferencesManager(context);
        }
        return instance;
    }

    public void saveToken(String token) {
        sharedPreferences.edit().putString(KEY_TOKEN, token).apply();
    }

    public String getToken() {
        return sharedPreferences.getString(KEY_TOKEN, null);
    }

    public void saveUser(User user) {
        String json = gson.toJson(user);
        sharedPreferences.edit().putString(KEY_USER, json).apply();
    }

    public User getUser() {
        String json = sharedPreferences.getString(KEY_USER, null);
        if (json == null) return null;
        return gson.fromJson(json, User.class);
    }

    public void saveProfile(Profile profile) {
        String json = gson.toJson(profile);
        sharedPreferences.edit().putString(KEY_PROFILE, json).apply();
    }

    public Profile getProfile() {
        String json = sharedPreferences.getString(KEY_PROFILE, null);
        if (json == null) return null;
        return gson.fromJson(json, Profile.class);
    }

    public void saveLastLoginTimestamp(String timestamp) {
        sharedPreferences.edit().putString(KEY_LAST_LOGIN, timestamp).apply();
    }

    public String getLastLoginTimestamp() {
        return sharedPreferences.getString(KEY_LAST_LOGIN, null);
    }

    public void setApiModeEnabled(boolean enabled) {
        sharedPreferences.edit().putBoolean(KEY_API_MODE, enabled).apply();
    }

    public boolean isApiModeEnabled() {
        return sharedPreferences.getBoolean(KEY_API_MODE, false); // Default to direct Firebase integration
    }

    public void setServerUrl(String url) {
        sharedPreferences.edit().putString(KEY_SERVER_URL, url).apply();
    }

    public String getServerUrl() {
        return sharedPreferences.getString(KEY_SERVER_URL, "http://10.0.2.2:5000/api/");
    }

    public void clearSession() {
        sharedPreferences.edit()
                .remove(KEY_TOKEN)
                .remove(KEY_USER)
                .remove(KEY_PROFILE)
                .remove(KEY_LAST_LOGIN)
                .apply();
    }
}
