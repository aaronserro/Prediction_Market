package com.betting.backend.markets;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import com.betting.backend.user.User;
@Entity
@Table(name = "markets")
public class Market {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MarketCategory category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MarketStatus status;

    @Column(nullable = false)
    private LocalDateTime startDate;

    @Column(nullable = false)
    private LocalDateTime endDate;

    @Column(nullable = false)
    private String resolutionSource;

    @Column(nullable = false)
    private Long creatorId;

    @OneToMany(
            mappedBy = "market",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.EAGER
    )
    private List<Outcome> outcomes = new ArrayList<>();
    /**
     * LMSR Liquididity Paramater
     * A higher b means prices move quicker and prices move slower
     * Must be >=1
     *
     *
     * @return
     */
    @Column(name = "liquidity_b", nullable = false)
    @Min(1)
    private int liquidityB = 100; // sensible default for MVP; tune later
    public int getLiquidityB() {
        return liquidityB;
    }

    public void setLiquidityB(int liquidityB) {
        if (liquidityB < 1) {
            throw new IllegalArgumentException("liquidityB must be >= 1");
        }
        this.liquidityB = liquidityB;

    }
    @Transient
    public boolean isActive() {
    return this.status == MarketStatus.ACTIVE
           && this.endDate.isAfter(LocalDateTime.now());
}

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

    public MarketStatus getStatus() {
        return status;
    }

    public void setStatus(MarketStatus status) {
        this.status = status;
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

    public Long getCreatorId() {
        return creatorId;
    }

    public void setCreatorId(Long creatorId) {
        this.creatorId = creatorId;
    }

    public List<Outcome> getOutcomes() {
        return outcomes;
    }

    public void setOutcomes(List<Outcome> outcomes) {
        this.outcomes = outcomes;
    }


    // ==========================
    // Helper Methods
    // ==========================

    public void addOutcome(Outcome outcome) {
        this.outcomes.add(outcome);
        outcome.setMarket(this);
    }

    public void removeOutcome(Outcome outcome) {
        this.outcomes.remove(outcome);
        outcome.setMarket(null);
    }
}
