package com.aidiabetes.app.fragments;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.aidiabetes.app.R;
import com.aidiabetes.app.adapters.SugarHistoryAdapter;
import com.aidiabetes.app.firebase.FirebaseManager;
import com.aidiabetes.app.models.SugarReading;
import com.aidiabetes.app.services.ApiClient;
import com.aidiabetes.app.services.ApiService;
import com.aidiabetes.app.utils.SharedPreferencesManager;
import com.github.mikephil.charting.charts.LineChart;
import com.github.mikephil.charting.components.XAxis;
import com.github.mikephil.charting.components.YAxis;
import com.github.mikephil.charting.data.Entry;
import com.github.mikephil.charting.data.LineData;
import com.github.mikephil.charting.data.LineDataSet;
import com.github.mikephil.charting.formatter.ValueFormatter;
import com.google.android.material.chip.ChipGroup;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.TimeZone;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class HistoryFragment extends Fragment {

    private RecyclerView recyclerView;
    private ProgressBar progressBar;
    private TextView tvEmptyState;
    private SugarHistoryAdapter adapter;
    
    // Stats cards views
    private TextView tvStatsAvg, tvStatsHighest, tvStatsLowest;
    
    // Filters and Chart
    private ChipGroup chipGroupCategories, chipGroupRanges;
    private LineChart lineChart;
    
    private String activeCategory = "all"; // all, fasting, afterMeal, random
    private String activeRange = "weekly";  // weekly, monthly, all

    private final List<SugarReading> rawReadingsList = new ArrayList<>();
    private final List<SugarReading> displayedReadingsList = new ArrayList<>();

    private SharedPreferencesManager prefs;
    private FirebaseManager firebaseManager;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_history, container, false);

        prefs = SharedPreferencesManager.getInstance(requireContext());
        firebaseManager = FirebaseManager.getInstance(requireContext());

        recyclerView = view.findViewById(R.id.recycler_view_history);
        progressBar = view.findViewById(R.id.progress_bar);
        tvEmptyState = view.findViewById(R.id.tv_empty_state);

        tvStatsAvg = view.findViewById(R.id.tv_stats_avg);
        tvStatsHighest = view.findViewById(R.id.tv_stats_highest);
        tvStatsLowest = view.findViewById(R.id.tv_stats_lowest);

        chipGroupCategories = view.findViewById(R.id.chip_group_categories);
        chipGroupRanges = view.findViewById(R.id.chip_group_ranges);
        lineChart = view.findViewById(R.id.line_chart);

        recyclerView.setLayoutManager(new LinearLayoutManager(getContext()));
        adapter = new SugarHistoryAdapter(requireContext(), displayedReadingsList, new SugarHistoryAdapter.OnItemDeleteListener() {
            @Override
            public void onDeleteClick(SugarReading reading) {
                deleteLog(reading);
            }
        });
        recyclerView.setAdapter(adapter);

        setupFilterListeners();
        loadHistory();
        return view;
    }

    private void setupFilterListeners() {
        chipGroupCategories.setOnCheckedStateChangeListener((group, checkedIds) -> {
            if (checkedIds.isEmpty()) return;
            int checkedId = checkedIds.get(0);
            if (checkedId == R.id.chip_cat_all) {
                activeCategory = "all";
            } else if (checkedId == R.id.chip_cat_fasting) {
                activeCategory = "fasting";
            } else if (checkedId == R.id.chip_cat_after_meal) {
                activeCategory = "afterMeal";
            } else if (checkedId == R.id.chip_cat_random) {
                activeCategory = "random";
            }
            filterAndDisplayReadings();
        });

        chipGroupRanges.setOnCheckedStateChangeListener((group, checkedIds) -> {
            if (checkedIds.isEmpty()) return;
            int checkedId = checkedIds.get(0);
            if (checkedId == R.id.chip_range_weekly) {
                activeRange = "weekly";
            } else if (checkedId == R.id.chip_range_monthly) {
                activeRange = "monthly";
            } else if (checkedId == R.id.chip_range_all) {
                activeRange = "all";
            }
            filterAndDisplayReadings();
        });
    }

    private void loadHistory() {
        progressBar.setVisibility(View.VISIBLE);
        recyclerView.setVisibility(View.GONE);
        tvEmptyState.setVisibility(View.GONE);

        if (prefs.isApiModeEnabled()) {
            // Fetch from backend
            ApiService api = ApiClient.getApiService(requireContext());
            api.getSugarHistory().enqueue(new Callback<ApiService.SugarHistoryResponse>() {
                @Override
                public void onResponse(Call<ApiService.SugarHistoryResponse> call, Response<ApiService.SugarHistoryResponse> response) {
                    if (!isAdded() || getContext() == null) return;
                    progressBar.setVisibility(View.GONE);
                    if (response.isSuccessful() && response.body() != null && response.body().success) {
                        rawReadingsList.clear();
                        rawReadingsList.addAll(response.body().readings);
                        filterAndDisplayReadings();
                    } else {
                        showEmptyState();
                    }
                }

                @Override
                public void onFailure(Call<ApiService.SugarHistoryResponse> call, Throwable t) {
                    if (!isAdded() || getContext() == null) return;
                    progressBar.setVisibility(View.GONE);
                    showEmptyState();
                    Toast.makeText(getContext(), "Failed to retrieve logs: " + t.getMessage(), Toast.LENGTH_SHORT).show();
                }
            });
        } else {
            // Fetch from Firestore
            firebaseManager.fetchSugarHistory(null, new FirebaseManager.DataCallback<List<SugarReading>>() {
                @Override
                public void onSuccess(List<SugarReading> data) {
                    if (!isAdded() || getContext() == null) return;
                    progressBar.setVisibility(View.GONE);
                    rawReadingsList.clear();
                    rawReadingsList.addAll(data);
                    filterAndDisplayReadings();
                }

                @Override
                public void onFailure(String error) {
                    if (!isAdded() || getContext() == null) return;
                    progressBar.setVisibility(View.GONE);
                    showEmptyState();
                    Toast.makeText(getContext(), "Firestore error: " + error, Toast.LENGTH_SHORT).show();
                }
            });
        }
    }

    private void filterAndDisplayReadings() {
        if (!isAdded() || getContext() == null) return;
        displayedReadingsList.clear();
        
        long now = System.currentTimeMillis();
        long timeLimit = 0;
        if ("weekly".equals(activeRange)) {
            timeLimit = now - 7L * 24 * 60 * 60 * 1000;
        } else if ("monthly".equals(activeRange)) {
            timeLimit = now - 30L * 24 * 60 * 60 * 1000;
        }

        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
        sdf.setTimeZone(TimeZone.getTimeZone("UTC"));

        for (SugarReading r : rawReadingsList) {
            // Apply category filter
            if (!"all".equals(activeCategory) && !r.getType().equalsIgnoreCase(activeCategory)) {
                continue;
            }
            // Apply range filter
            if (timeLimit > 0) {
                try {
                    Date date = sdf.parse(r.getCreatedAt());
                    if (date != null && date.getTime() < timeLimit) {
                        continue;
                    }
                } catch (Exception e) {
                    // ignore parse exception and include log
                }
            }
            displayedReadingsList.add(r);
        }

        calculateStats(displayedReadingsList);
        setupChart(displayedReadingsList);

        if (!displayedReadingsList.isEmpty()) {
            adapter.notifyDataSetChanged();
            recyclerView.setVisibility(View.VISIBLE);
            tvEmptyState.setVisibility(View.GONE);
        } else {
            showEmptyState();
        }
    }

    private void calculateStats(List<SugarReading> readings) {
        if (readings == null || readings.isEmpty()) {
            tvStatsAvg.setText("—");
            tvStatsHighest.setText("—");
            tvStatsLowest.setText("—");
            return;
        }
        double sum = 0;
        double max = Double.MIN_VALUE;
        double min = Double.MAX_VALUE;
        for (SugarReading r : readings) {
            double v = r.getValue();
            sum += v;
            if (v > max) max = v;
            if (v < min) min = v;
        }
        double avg = sum / readings.size();
        tvStatsAvg.setText(String.format(Locale.US, "%.0f mg/dL", avg));
        tvStatsHighest.setText(String.format(Locale.US, "%.0f", max));
        tvStatsLowest.setText(String.format(Locale.US, "%.0f", min));
    }

    private void setupChart(List<SugarReading> readings) {
        if (!isAdded() || getContext() == null) return;
        lineChart.clear();
        if (readings == null || readings.isEmpty()) {
            lineChart.invalidate();
            return;
        }

        // Sort ascending chronologically for plotting the line
        List<SugarReading> chartReadings = new ArrayList<>(readings);
        Collections.sort(chartReadings, (a, b) -> a.getCreatedAt().compareTo(b.getCreatedAt()));

        List<Entry> entries = new ArrayList<>();
        final List<String> labels = new ArrayList<>();

        SimpleDateFormat inputSdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
        inputSdf.setTimeZone(TimeZone.getTimeZone("UTC"));
        SimpleDateFormat displaySdf = new SimpleDateFormat("MM/dd HH:mm", Locale.US);

        for (int i = 0; i < chartReadings.size(); i++) {
            SugarReading r = chartReadings.get(i);
            entries.add(new Entry(i, (float) r.getValue()));
            
            String label = "";
            try {
                Date date = inputSdf.parse(r.getCreatedAt());
                if (date != null) {
                    label = displaySdf.format(date);
                }
            } catch (Exception e) {
                if (r.getCreatedAt().length() >= 10) {
                    label = r.getCreatedAt().substring(5, 10);
                }
            }
            labels.add(label);
        }

        LineDataSet dataSet = new LineDataSet(entries, "Blood Sugar (mg/dL)");
        dataSet.setColor(androidx.core.content.ContextCompat.getColor(getContext(), R.color.primary));
        dataSet.setCircleColor(androidx.core.content.ContextCompat.getColor(getContext(), R.color.primary));
        dataSet.setLineWidth(2.5f);
        dataSet.setCircleRadius(4f);
        dataSet.setDrawCircleHole(true);
        dataSet.setCircleHoleColor(androidx.core.content.ContextCompat.getColor(getContext(), R.color.bg_light));
        dataSet.setCircleHoleRadius(2f);
        dataSet.setDrawValues(false);
        dataSet.setMode(LineDataSet.Mode.CUBIC_BEZIER);

        // Fill color
        dataSet.setDrawFilled(true);
        dataSet.setFillColor(androidx.core.content.ContextCompat.getColor(getContext(), R.color.primary));
        dataSet.setFillAlpha(40);

        LineData lineData = new LineData(dataSet);
        lineChart.setData(lineData);

        lineChart.getDescription().setEnabled(false);
        lineChart.getLegend().setEnabled(true);
        lineChart.getLegend().setTextColor(androidx.core.content.ContextCompat.getColor(getContext(), R.color.text_muted));
        lineChart.setTouchEnabled(true);
        lineChart.setDragEnabled(true);
        lineChart.setScaleEnabled(true);
        lineChart.setPinchZoom(true);
        lineChart.setDrawGridBackground(false);

        XAxis xAxis = lineChart.getXAxis();
        xAxis.setPosition(XAxis.XAxisPosition.BOTTOM);
        xAxis.setDrawGridLines(false);
        xAxis.setTextColor(androidx.core.content.ContextCompat.getColor(getContext(), R.color.text_muted));
        xAxis.setGranularity(1f);
        xAxis.setValueFormatter(new ValueFormatter() {
            @Override
            public String getFormattedValue(float value) {
                int idx = Math.round(value);
                if (idx >= 0 && idx < labels.size()) {
                    return labels.get(idx);
                }
                return "";
            }
        });

        YAxis leftAxis = lineChart.getAxisLeft();
        leftAxis.setDrawGridLines(true);
        leftAxis.setGridColor(androidx.core.content.ContextCompat.getColor(getContext(), R.color.gray_200));
        leftAxis.setTextColor(androidx.core.content.ContextCompat.getColor(getContext(), R.color.text_muted));
        
        YAxis rightAxis = lineChart.getAxisRight();
        rightAxis.setEnabled(false);

        lineChart.animateX(500);
        lineChart.invalidate();
    }

    private void showEmptyState() {
        recyclerView.setVisibility(View.GONE);
        tvEmptyState.setVisibility(View.VISIBLE);
        tvStatsAvg.setText("—");
        tvStatsHighest.setText("—");
        tvStatsLowest.setText("—");
        lineChart.clear();
        lineChart.invalidate();
    }

    private void deleteLog(SugarReading reading) {
        progressBar.setVisibility(View.VISIBLE);

        if (prefs.isApiModeEnabled()) {
            ApiService api = ApiClient.getApiService(requireContext());
            api.deleteSugarReading(reading.getId()).enqueue(new Callback<ApiService.GenericResponse>() {
                @Override
                public void onResponse(Call<ApiService.GenericResponse> call, Response<ApiService.GenericResponse> response) {
                    if (!isAdded() || getContext() == null) return;
                    progressBar.setVisibility(View.GONE);
                    if (response.isSuccessful() && response.body() != null && response.body().success) {
                        Toast.makeText(getContext(), "Reading deleted from server", Toast.LENGTH_SHORT).show();
                        loadHistory();
                    } else {
                        Toast.makeText(getContext(), "Delete failed", Toast.LENGTH_SHORT).show();
                    }
                }

                @Override
                public void onFailure(Call<ApiService.GenericResponse> call, Throwable t) {
                    if (!isAdded() || getContext() == null) return;
                    progressBar.setVisibility(View.GONE);
                    Toast.makeText(getContext(), t.getMessage(), Toast.LENGTH_SHORT).show();
                }
            });
        } else {
            firebaseManager.deleteSugarReading(reading.getId(), new FirebaseManager.OperationCallback() {
                @Override
                public void onSuccess() {
                    if (!isAdded() || getContext() == null) return;
                    progressBar.setVisibility(View.GONE);
                    Toast.makeText(getContext(), "Reading deleted from Firestore", Toast.LENGTH_SHORT).show();
                    loadHistory();
                }

                @Override
                public void onFailure(String error) {
                    if (!isAdded() || getContext() == null) return;
                    progressBar.setVisibility(View.GONE);
                    Toast.makeText(getContext(), "Delete failed: " + error, Toast.LENGTH_SHORT).show();
                }
            });
        }
    }
}
