package com.aidiabetes.app.firebase;

import android.content.Context;
import android.util.Log;
import com.aidiabetes.app.models.Profile;
import com.aidiabetes.app.models.SugarReading;
import com.aidiabetes.app.models.User;
import com.google.firebase.FirebaseApp;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.firestore.FirebaseFirestore;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class FirebaseManager {
    private static final String TAG = "FirebaseManager";
    private static FirebaseManager instance;
    
    private FirebaseAuth auth;
    private FirebaseFirestore firestore;
    private boolean isMocked = false;

    // Resilient local mock databases for offline/unconfigured developer states
    private final Map<String, User> mockUsers = new HashMap<>();
    private final Map<String, Profile> mockProfiles = new HashMap<>();
    private final List<SugarReading> mockSugarReadings = new ArrayList<>();
    private String activeMockUserId = null;

    public interface AuthCallback {
        void onSuccess(User user);
        void onFailure(String error);
    }

    public interface OperationCallback {
        void onSuccess();
        void onFailure(String error);
    }

    public interface DataCallback<T> {
        void onSuccess(T data);
        void onFailure(String error);
    }

    private FirebaseManager(Context context) {
        try {
            // Attempt to initialize real Firebase modules
            if (FirebaseApp.getApps(context).isEmpty()) {
                FirebaseApp.initializeApp(context);
            }
            
            // Check if initialized options are dummy placeholders
            com.google.firebase.FirebaseOptions options = FirebaseApp.getInstance().getOptions();
            String key = options.getApiKey();
            if (key == null || key.isEmpty() || key.contains("MockApiKey")) {
                Log.w(TAG, "Firebase Web API key is placeholder/invalid. Activating sandbox mock mode.");
                isMocked = true;
                setupMockData();
            } else {
                auth = FirebaseAuth.getInstance();
                firestore = FirebaseFirestore.getInstance();
                Log.d(TAG, "Firebase SDKs successfully connected.");
            }
        } catch (Exception e) {
            Log.w(TAG, "Firebase App configuration missing or google-services.json not found. Falling back to local mock databases.", e);
            isMocked = true;
            setupMockData();
        }
    }

    public static synchronized FirebaseManager getInstance(Context context) {
        if (instance == null) {
            instance = new FirebaseManager(context);
        }
        return instance;
    }

    public boolean isMocked() {
        return isMocked;
    }

    private void setupMockData() {
        // Seed default sandbox items
        User demoUser = new User("demo_user_123", "John Doe", "demo@diabetes.com", "+1234567890", true, true, "2026-06-23T12:00:00Z");
        mockUsers.put(demoUser.getEmail(), demoUser);
        
        Profile demoProfile = new Profile("demo_user_123", "John Doe", 32, "Male", 175f, 78f, "Type 2", "Lightly Active", "None", "2026-06-23T12:00:00Z");
        mockProfiles.put(demoUser.getId(), demoProfile);

        mockSugarReadings.add(new SugarReading("r1", "demo_user_123", "fasting", 95.0, "NORMAL", "Low", "Felt good", "2026-06-23T08:00:00Z"));
        mockSugarReadings.add(new SugarReading("r2", "demo_user_123", "afterMeal", 155.0, "PREDIABETIC", "Medium", "After heavy breakfast", "2026-06-23T09:30:00Z"));
        mockSugarReadings.add(new SugarReading("r3", "demo_user_123", "random", 210.0, "HIGH DIABETES RISK", "High", "Felt dizzy", "2026-06-23T11:45:00Z"));
    }

    // --- Authentication Actions ---

    public void login(String email, String password, AuthCallback callback) {
        if (isMocked) {
            User user = mockUsers.get(email);
            if (user != null) {
                activeMockUserId = user.getId();
                callback.onSuccess(user);
            } else {
                callback.onFailure("Invalid credentials in developer sandbox mode. Use 'demo@diabetes.com'.");
            }
            return;
        }

        auth.signInWithEmailAndPassword(email, password)
                .addOnSuccessListener(authResult -> {
                    String uid = authResult.getUser().getUid();
                    fetchUserData(uid, callback);
                })
                .addOnFailureListener(e -> callback.onFailure(e.getMessage()));
    }

    public void register(String name, String email, String password, String phone, AuthCallback callback) {
        if (isMocked) {
            if (mockUsers.containsKey(email)) {
                callback.onFailure("User already exists in mock database.");
                return;
            }
            String uid = "user_" + System.currentTimeMillis();
            User newUser = new User(uid, name, email, phone, true, false, "2026-06-23T12:00:00Z");
            mockUsers.put(email, newUser);
            activeMockUserId = uid;
            callback.onSuccess(newUser);
            return;
        }

        auth.createUserWithEmailAndPassword(email, password)
                .addOnSuccessListener(authResult -> {
                    String uid = authResult.getUser().getUid();
                    User newUser = new User(uid, name, email, phone, true, false, "2026-06-23T12:00:00Z");
                    firestore.collection("Users").document(uid).set(newUser)
                            .addOnSuccessListener(aVoid -> callback.onSuccess(newUser))
                            .addOnFailureListener(e -> callback.onFailure(e.getMessage()));
                })
                .addOnFailureListener(e -> callback.onFailure(e.getMessage()));
    }

    public void logout() {
        if (isMocked) {
            activeMockUserId = null;
            return;
        }
        auth.signOut();
    }

    // --- Profiles CRUD ---

    public void fetchProfile(String userId, DataCallback<Profile> callback) {
        if (isMocked) {
            Profile profile = mockProfiles.get(userId != null ? userId : activeMockUserId);
            if (profile != null) {
                callback.onSuccess(profile);
            } else {
                callback.onFailure("Profile not found.");
            }
            return;
        }

        firestore.collection("Profiles").document(userId).get()
                .addOnSuccessListener(documentSnapshot -> {
                    if (documentSnapshot.exists()) {
                        callback.onSuccess(documentSnapshot.toObject(Profile.class));
                    } else {
                        callback.onFailure("Profile not found");
                    }
                })
                .addOnFailureListener(e -> callback.onFailure(e.getMessage()));
    }

    public void saveProfile(Profile profile, OperationCallback callback) {
        if (isMocked) {
            mockProfiles.put(profile.getUserId(), profile);
            User u = findUserById(profile.getUserId());
            if (u != null) u.setProfileCompleted(true);
            callback.onSuccess();
            return;
        }

        firestore.collection("Profiles").document(profile.getUserId()).set(profile)
                .addOnSuccessListener(aVoid -> {
                    // Update profile status in Users collection
                    firestore.collection("Users").document(profile.getUserId())
                            .update("profileCompleted", true)
                            .addOnSuccessListener(aVoid2 -> callback.onSuccess())
                            .addOnFailureListener(e -> callback.onFailure("Failed updating user state: " + e.getMessage()));
                })
                .addOnFailureListener(e -> callback.onFailure(e.getMessage()));
    }

    // --- Sugar Logs CRUD ---

    public void saveSugarReading(SugarReading reading, OperationCallback callback) {
        if (isMocked) {
            reading.setId("log_" + System.currentTimeMillis());
            reading.setUserId(activeMockUserId);
            mockSugarReadings.add(reading);
            callback.onSuccess();
            return;
        }

        String docId = firestore.collection("SugarReadings").document().getId();
        reading.setId(docId);
        firestore.collection("SugarReadings").document(docId).set(reading)
                .addOnSuccessListener(aVoid -> callback.onSuccess())
                .addOnFailureListener(e -> callback.onFailure(e.getMessage()));
    }

    public void fetchSugarHistory(String userId, DataCallback<List<SugarReading>> callback) {
        String targetUid = userId != null ? userId : (isMocked ? activeMockUserId : (auth.getCurrentUser() != null ? auth.getCurrentUser().getUid() : null));
        if (targetUid == null) {
            callback.onFailure("User session invalid.");
            return;
        }

        if (isMocked) {
            List<SugarReading> filtered = new ArrayList<>();
            for (SugarReading r : mockSugarReadings) {
                if (r.getUserId().equals(targetUid)) {
                    filtered.add(r);
                }
            }
            // Sort by date descending
            Collections.sort(filtered, (a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));
            callback.onSuccess(filtered);
            return;
        }

        firestore.collection("SugarReadings")
                .whereEqualTo("userId", targetUid)
                .get()
                .addOnSuccessListener(queryDocumentSnapshots -> {
                    List<SugarReading> list = queryDocumentSnapshots.toObjects(SugarReading.class);
                    Collections.sort(list, (a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));
                    callback.onSuccess(list);
                })
                .addOnFailureListener(e -> callback.onFailure(e.getMessage()));
    }

    public void deleteSugarReading(String readingId, OperationCallback callback) {
        if (isMocked) {
            SugarReading found = null;
            for (SugarReading r : mockSugarReadings) {
                if (r.getId().equals(readingId)) {
                    found = r;
                    break;
                }
            }
            if (found != null) {
                mockSugarReadings.remove(found);
                callback.onSuccess();
            } else {
                callback.onFailure("Record not found.");
            }
            return;
        }

        firestore.collection("SugarReadings").document(readingId).delete()
                .addOnSuccessListener(aVoid -> callback.onSuccess())
                .addOnFailureListener(e -> callback.onFailure(e.getMessage()));
    }

    // --- Helpers ---

    private void fetchUserData(String uid, AuthCallback callback) {
        firestore.collection("Users").document(uid).get()
                .addOnSuccessListener(documentSnapshot -> {
                    if (documentSnapshot.exists()) {
                        callback.onSuccess(documentSnapshot.toObject(User.class));
                    } else {
                        callback.onFailure("User record missing in DB");
                    }
                })
                .addOnFailureListener(e -> callback.onFailure(e.getMessage()));
    }

    private User findUserById(String uid) {
        for (User u : mockUsers.values()) {
            if (u.getId().equals(uid)) return u;
        }
        return null;
    }
}
