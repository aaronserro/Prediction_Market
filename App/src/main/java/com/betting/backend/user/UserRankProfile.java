package com.betting.backend.user;

import com.betting.backend.ranking.model.RankTier;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;

@Entity
public class UserRankProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id")
    private User user;

    private int traderPoints;

    private int predictorPoints;

    private int overallPoints;

    @Enumerated(EnumType.STRING)
    private RankTier traderRank;

    @Enumerated(EnumType.STRING)
    private RankTier predictorRank;

    @Enumerated(EnumType.STRING)
    private RankTier overallRank;

    private int resolvedMarketsCount;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public int getTraderPoints() {
        return traderPoints;
    }

    public void setTraderPoints(int traderPoints) {
        this.traderPoints = traderPoints;
    }

    public int getPredictorPoints() {
        return predictorPoints;
    }

    public void setPredictorPoints(int predictorPoints) {
        this.predictorPoints = predictorPoints;
    }

    public int getOverallPoints() {
        return overallPoints;
    }

    public void setOverallPoints(int overallPoints) {
        this.overallPoints = overallPoints;
    }

    public RankTier getTraderRank() {
        return traderRank;
    }

    public void setTraderRank(RankTier traderRank) {
        this.traderRank = traderRank;
    }

    public RankTier getPredictorRank() {
        return predictorRank;
    }

    public void setPredictorRank(RankTier predictorRank) {
        this.predictorRank = predictorRank;
    }

    public RankTier getOverallRank() {
        return overallRank;
    }

    public void setOverallRank(RankTier overallRank) {
        this.overallRank = overallRank;
    }

    public int getResolvedMarketsCount() {
        return resolvedMarketsCount;
    }

    public void setResolvedMarketsCount(int resolvedMarketsCount) {
        this.resolvedMarketsCount = resolvedMarketsCount;
    }
}
