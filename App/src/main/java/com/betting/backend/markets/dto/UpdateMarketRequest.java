package com.betting.backend.markets.dto;

import java.time.LocalDateTime;

import com.betting.backend.markets.MarketCategory;
import com.betting.backend.markets.MarketStatus;

public class UpdateMarketRequest {

    private String title;
    private String description;
    private MarketCategory category;
    private MarketStatus status;
    private LocalDateTime endDate;
    private String resolutionSource;

    public UpdateMarketRequest() {
    }

    // ---- Getters & Setters ----

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public MarketCategory getCategory() {
        return category;
    }

    public void setCategory(MarketCategory category) {
        this.category = category;
    }

    public MarketStatus getStatus() {
        return status;
    }

    public void setStatus(MarketStatus status) {
        this.status = status;
    }

    public LocalDateTime getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDateTime endDate) {
        this.endDate = endDate;
    }

    public String getResolutionSource() {
        return resolutionSource;
    }

    public void setResolutionSource(String resolutionSource) {
        this.resolutionSource = resolutionSource;
    }
}
