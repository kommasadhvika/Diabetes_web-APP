package com.aidiabetes.app.fragments;

import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import com.aidiabetes.app.R;
import com.aidiabetes.app.firebase.FirebaseManager;
import com.aidiabetes.app.models.ChatMessage;
import com.aidiabetes.app.models.User;
import com.aidiabetes.app.services.ApiClient;
import com.aidiabetes.app.services.ApiService;
import com.aidiabetes.app.utils.SharedPreferencesManager;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.TimeZone;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class ChatbotFragment extends Fragment {

    private LinearLayout layoutChatHistory;
    private ScrollView chatScrollView;
    private EditText etInput;
    private Button btnSend, btnClearChat;
    private ProgressBar progressBar;

    private SharedPreferencesManager prefs;
    private final List<ChatMessage> localMessages = new ArrayList<>();

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_chatbot, container, false);

        prefs = SharedPreferencesManager.getInstance(requireContext());

        layoutChatHistory = view.findViewById(R.id.layout_chat_history);
        chatScrollView = view.findViewById(R.id.chat_scroll_view);
        etInput = view.findViewById(R.id.et_chat_input);
        btnSend = view.findViewById(R.id.btn_chat_send);
        btnClearChat = view.findViewById(R.id.btn_clear_chat);
        progressBar = view.findViewById(R.id.progress_bar);

        btnSend.setOnClickListener(v -> sendMessage());
        btnClearChat.setOnClickListener(v -> handleClearChat());

        loadChatHistory();
        return view;
    }

    private void loadChatHistory() {
        progressBar.setVisibility(View.VISIBLE);
        layoutChatHistory.removeAllViews();

        if (prefs.isApiModeEnabled()) {
            ApiService api = ApiClient.getApiService(requireContext());
            api.getChatHistory().enqueue(new Callback<ApiService.ChatHistoryResponse>() {
                @Override
                public void onResponse(Call<ApiService.ChatHistoryResponse> call, Response<ApiService.ChatHistoryResponse> response) {
                    if (!isAdded() || getContext() == null) return;
                    progressBar.setVisibility(View.GONE);
                    if (response.isSuccessful() && response.body() != null && response.body().success) {
                        for (ChatMessage m : response.body().messages) {
                            addMessageBubble(m);
                        }
                    }
                }

                @Override
                public void onFailure(Call<ApiService.ChatHistoryResponse> call, Throwable t) {
                    if (!isAdded() || getContext() == null) return;
                    progressBar.setVisibility(View.GONE);
                    Toast.makeText(getContext(), "Failed to load chat: " + t.getMessage(), Toast.LENGTH_SHORT).show();
                }
            });
        } else {
            progressBar.setVisibility(View.GONE);
            if (localMessages.isEmpty()) {
                localMessages.add(new ChatMessage("g1", "demo", "assistant", "Hello! I am your DiaPredict AI Advisor. Ask me anything about managing your diabetes, food glycemic indices, or workouts.", getTimestamp()));
            }
            for (ChatMessage m : localMessages) {
                addMessageBubble(m);
            }
        }
    }

    private void sendMessage() {
        String text = etInput.getText().toString().trim();
        if (text.isEmpty()) return;

        etInput.setText("");
        
        ChatMessage userMsg = new ChatMessage("u_" + System.currentTimeMillis(), "user_id", "user", text, getTimestamp());
        addMessageBubble(userMsg);
        
        if (!prefs.isApiModeEnabled()) {
            localMessages.add(userMsg);
        }

        btnSend.setEnabled(false);

        // Show typing animation placeholder bubble
        ChatMessage typingMsg = new ChatMessage("typing_id", "assistant", "assistant", "DiaPredict is thinking...", getTimestamp());
        final View typingView = addMessageBubble(typingMsg);

        if (prefs.isApiModeEnabled()) {
            ApiService api = ApiClient.getApiService(requireContext());
            api.sendMessageToChatbot(new ApiService.ChatRequest(text)).enqueue(new Callback<ApiService.ChatResponse>() {
                @Override
                public void onResponse(Call<ApiService.ChatResponse> call, Response<ApiService.ChatResponse> response) {
                    if (!isAdded() || getContext() == null) return;
                    btnSend.setEnabled(true);
                    layoutChatHistory.removeView(typingView);
                    if (response.isSuccessful() && response.body() != null && response.body().success) {
                        addMessageBubble(response.body().assistantMessage);
                    } else {
                        Toast.makeText(getContext(), "Chat error", Toast.LENGTH_SHORT).show();
                    }
                }

                @Override
                public void onFailure(Call<ApiService.ChatResponse> call, Throwable t) {
                    if (!isAdded() || getContext() == null) return;
                    btnSend.setEnabled(true);
                    layoutChatHistory.removeView(typingView);
                    Toast.makeText(getContext(), "Network error: " + t.getMessage(), Toast.LENGTH_SHORT).show();
                }
            });
        } else {
            // Sandbox fallback automated replies with typing delay simulation
            new Handler(Looper.getMainLooper()).postDelayed(() -> {
                if (!isAdded() || getContext() == null) return;
                btnSend.setEnabled(true);
                layoutChatHistory.removeView(typingView);
                String replyText = getSandboxReply(text);
                ChatMessage assistantMsg = new ChatMessage("a_" + System.currentTimeMillis(), "demo", "assistant", replyText, getTimestamp());
                localMessages.add(assistantMsg);
                addMessageBubble(assistantMsg);
            }, 1200);
        }
    }

    private void handleClearChat() {
        progressBar.setVisibility(View.VISIBLE);
        if (prefs.isApiModeEnabled()) {
            ApiService api = ApiClient.getApiService(requireContext());
            api.clearChatHistory().enqueue(new Callback<ApiService.GenericResponse>() {
                @Override
                public void onResponse(Call<ApiService.GenericResponse> call, Response<ApiService.GenericResponse> response) {
                    if (!isAdded() || getContext() == null) return;
                    progressBar.setVisibility(View.GONE);
                    if (response.isSuccessful() && response.body() != null && response.body().success) {
                        Toast.makeText(getContext(), "Chat history cleared successfully!", Toast.LENGTH_SHORT).show();
                        loadChatHistory();
                    } else {
                        Toast.makeText(getContext(), "Failed to clear history", Toast.LENGTH_SHORT).show();
                    }
                }

                @Override
                public void onFailure(Call<ApiService.GenericResponse> call, Throwable t) {
                    if (!isAdded() || getContext() == null) return;
                    progressBar.setVisibility(View.GONE);
                    Toast.makeText(getContext(), "Network error: " + t.getMessage(), Toast.LENGTH_SHORT).show();
                }
            });
        } else {
            progressBar.setVisibility(View.GONE);
            localMessages.clear();
            loadChatHistory();
            Toast.makeText(getContext(), "Sandbox chat history cleared!", Toast.LENGTH_SHORT).show();
        }
    }

    private View addMessageBubble(ChatMessage msg) {
        if (!isAdded() || getContext() == null) return null;
        LayoutInflater inflater = LayoutInflater.from(getContext());
        View view = inflater.inflate(R.layout.item_chat, layoutChatHistory, false);

        View containerAssistant = view.findViewById(R.id.container_assistant);
        View containerUser = view.findViewById(R.id.container_user);

        if ("user".equals(msg.getSender())) {
            containerAssistant.setVisibility(View.GONE);
            containerUser.setVisibility(View.VISIBLE);
            TextView tv = view.findViewById(R.id.tv_msg_user);
            tv.setText(msg.getMessage());
        } else {
            containerAssistant.setVisibility(View.VISIBLE);
            containerUser.setVisibility(View.GONE);
            TextView tv = view.findViewById(R.id.tv_msg_assistant);
            tv.setText(msg.getMessage());

            if ("typing_id".equals(msg.getId())) {
                tv.setTypeface(null, android.graphics.Typeface.ITALIC);
                tv.setTextColor(androidx.core.content.ContextCompat.getColor(getContext(), R.color.text_muted));
            }
        }

        layoutChatHistory.addView(view);
        
        // Auto scroll to bottom
        chatScrollView.post(() -> chatScrollView.fullScroll(View.FOCUS_DOWN));
        return view;
    }

    private String getTimestamp() {
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
        sdf.setTimeZone(TimeZone.getTimeZone("UTC"));
        return sdf.format(new Date());
    }

    private String getSandboxReply(String query) {
        String lc = query.toLowerCase();
        if (lc.contains("sugar") || lc.contains("glucose")) {
            return "Fasting glucose should ideally be under 100 mg/dL and post-meal under 140 mg/dL. Elevated levels cause vascular inflammation. Keep tracking daily.\n\nDisclaimer: Informational input only. Consult your endocrinologist.";
        } else if (lc.contains("rice") || lc.contains("mango") || lc.contains("carbs")) {
            return "White rice and mangoes have high glycemic indices (GI > 70) which cause prompt blood sugar spikes. Choose brown rice or quinoa instead, and limit high GI fruits.\n\nDisclaimer: Informational input only. Consult your doctor.";
        } else if (lc.contains("walk") || lc.contains("exercise") || lc.contains("run")) {
            return "Brisk walking for 15-30 minutes post meals engages skeletal muscles as glucose sinks, clearing blood glucose without insulin load. Aim for 150 mins weekly.\n\nDisclaimer: Informational input only. Consult your doctor.";
        }
        return "That is a valuable metabolic query. In general, maintaining consistent meal times, eating fiber before carbs, and staying hydrated are core principles in managing diabetes.\n\nDisclaimer: Informational input only. Coordinate treatments with your doctor.";
    }
}
