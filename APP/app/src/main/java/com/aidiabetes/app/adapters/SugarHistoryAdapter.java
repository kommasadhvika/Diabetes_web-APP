package com.aidiabetes.app.adapters;

import android.content.Context;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;
import androidx.recyclerview.widget.RecyclerView;
import com.aidiabetes.app.R;
import com.aidiabetes.app.models.SugarReading;
import java.util.List;
import java.util.Locale;

public class SugarHistoryAdapter extends RecyclerView.Adapter<SugarHistoryAdapter.ViewHolder> {

    private final List<SugarReading> readings;
    private final Context context;
    private final OnItemDeleteListener deleteListener;

    public interface OnItemDeleteListener {
        void onDeleteClick(SugarReading reading);
    }

    public SugarHistoryAdapter(Context context, List<SugarReading> readings, OnItemDeleteListener deleteListener) {
        this.context = context;
        this.readings = readings;
        this.deleteListener = deleteListener;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_sugar_reading, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        SugarReading reading = readings.get(position);

        holder.tvValue.setText(String.format(Locale.US, "%.1f", reading.getValue()));
        holder.tvType.setText(reading.getType() != null ? reading.getType().toUpperCase() : "RANDOM");
        holder.tvClassification.setText(reading.getClassification() != null ? reading.getClassification() : "NORMAL");
        
        String createdAt = reading.getCreatedAt();
        if (createdAt != null && createdAt.length() >= 10) {
            holder.tvDate.setText(createdAt.substring(0, 10)); // Shows YYYY-MM-DD
        } else {
            holder.tvDate.setText(createdAt != null ? createdAt : "—");
        }
        
        holder.tvNotes.setText(reading.getNotes() == null || reading.getNotes().isEmpty() ? "No additional details" : reading.getNotes());

        // Color coding logic based on risk levels
        int colorRes;
        String riskLevel = reading.getRiskLevel();
        String riskLower = riskLevel != null ? riskLevel.toLowerCase() : "low";
        switch (riskLower) {
            case "low":
                colorRes = R.color.risk_low;
                break;
            case "medium":
                colorRes = R.color.risk_medium;
                break;
            case "high":
                colorRes = R.color.risk_high;
                break;
            default:
                colorRes = R.color.text_muted;
        }

        int resolvedColor = ContextCompat.getColor(context, colorRes);
        holder.indicatorBar.setBackgroundColor(resolvedColor);
        holder.tvClassification.setTextColor(resolvedColor);

        holder.btnDelete.setOnClickListener(v -> {
            if (deleteListener != null) {
                deleteListener.onDeleteClick(reading);
            }
        });
    }

    @Override
    public int getItemCount() {
        return readings.size();
    }

    public static class ViewHolder extends RecyclerView.ViewHolder {
        TextView tvValue, tvType, tvClassification, tvDate, tvNotes;
        View indicatorBar;
        ImageView btnDelete;

        public ViewHolder(@NonNull View itemView) {
            super(itemView);
            tvValue = itemView.findViewById(R.id.tv_value);
            tvType = itemView.findViewById(R.id.tv_type);
            tvClassification = itemView.findViewById(R.id.tv_classification);
            tvDate = itemView.findViewById(R.id.tv_date);
            tvNotes = itemView.findViewById(R.id.tv_notes);
            indicatorBar = itemView.findViewById(R.id.indicator_bar);
            btnDelete = itemView.findViewById(R.id.btn_delete);
        }
    }
}
