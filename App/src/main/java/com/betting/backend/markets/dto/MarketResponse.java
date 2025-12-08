package com.betting.backend.markets.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import com.betting.backend.markets.MarketCategory;
import com.betting.backend.markets.MarketStatus;

public class MarketResponse {

    private UUID id;

    private String title;

    private String description;

    private MarketCategory category;

    private List<OutcomeResponse> outcomes;

    private LocalDateTime startDate;

    private LocalDateTime endDate;

    private String resolutionSource;

    private MarketStatus status; // "UPCOMING", "ACTIVE", "CLOSED", "RESOLVED"

    private LocalDateTime createdAt;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

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

    public List<OutcomeResponse> getOutcomes() {
        return outcomes;
    }

    public void setOutcomes(List<OutcomeResponse> outcomes) {
        this.outcomes = outcomes;
    }

    public LocalDateTime getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDateTime startDate) {
        this.startDate = startDate;
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

    public MarketStatus getStatus() {
        return status;
    }

    public void setStatus(MarketStatus status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
