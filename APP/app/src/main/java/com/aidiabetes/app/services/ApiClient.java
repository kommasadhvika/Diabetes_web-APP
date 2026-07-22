package com.aidiabetes.app.services;

import android.content.Context;
import com.aidiabetes.app.utils.SharedPreferencesManager;
import java.io.IOException;
import java.util.concurrent.TimeUnit;
import okhttp3.Interceptor;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.logging.HttpLoggingInterceptor;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

public class ApiClient {
    private static Retrofit retrofit = null;
    private static ApiService apiService = null;

    public static synchronized ApiService getApiService(Context context) {
        if (apiService == null) {
            SharedPreferencesManager prefs = SharedPreferencesManager.getInstance(context);
            String baseUrl = prefs.getServerUrl();

            // Validate URL format to prevent Retrofit IllegalArgumentException crashes
            if (baseUrl == null || baseUrl.trim().isEmpty() || !baseUrl.startsWith("http") || !baseUrl.endsWith("/")) {
                baseUrl = "http://10.0.2.2:5000/api/";
            }

            // Logging Interceptor
            HttpLoggingInterceptor logging = new HttpLoggingInterceptor();
            logging.setLevel(HttpLoggingInterceptor.Level.BODY);

            // Authentication Interceptor to dynamically inject Bearer Token
            Interceptor authInterceptor = new Interceptor() {
                @Override
                public Response intercept(Chain chain) throws IOException {
                    Request originalRequest = chain.request();
                    String token = prefs.getToken();

                    if (token != null) {
                        Request authorizedRequest = originalRequest.newBuilder()
                                .header("Authorization", "Bearer " + token)
                                .header("Content-Type", "application/json")
                                .build();
                        return chain.proceed(authorizedRequest);
                    }
                    
                    return chain.proceed(originalRequest);
                }
            };

            OkHttpClient client = new OkHttpClient.Builder()
                    .connectTimeout(15, TimeUnit.SECONDS)
                    .readTimeout(15, TimeUnit.SECONDS)
                    .addInterceptor(authInterceptor)
                    .addInterceptor(logging)
                    .build();

            retrofit = new Retrofit.Builder()
                    .baseUrl(baseUrl)
                    .addConverterFactory(GsonConverterFactory.create())
                    .client(client)
                    .build();

            apiService = retrofit.create(ApiService.class);
        }
        return apiService;
    }

    // Call this if the Server URL changes in settings
    public static synchronized void resetClient() {
        retrofit = null;
        apiService = null;
    }
}
