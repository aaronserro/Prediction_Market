package com.betting.backend.ranking.dto;

import com.betting.backend.ranking.model.RankTier;

public class UserRankProfileResponse {

    private Long userId;

    private int traderPoints;
    private int predictorPoints;
    private int overallPoints;

    private RankTier traderRank;
    private RankTier predictorRank;
    private RankTier overallRank;

    private int resolvedMarketsCount;

    public UserRankProfileResponse() {}

    public UserRankProfileResponse(
            Long userId,
            int traderPoints,
            int predictorPoints,
            int overallPoints,
            RankTier traderRank,
            RankTier predictorRank,
            RankTier overallRank,
            int resolvedMarketsCount
    ) {
        this.userId = userId;
        this.traderPoints = traderPoints;
        this.predictorPoints = predictorPoints;
        this.overallPoints = overallPoints;
        this.traderRank = traderRank;
        this.predictorRank = predictorRank;
        this.overallRank = overallRank;
        this.resolvedMarketsCount = resolvedMarketsCount;
    }

    public Long getUserId() { return userId; }
    public int getTraderPoints() { return traderPoints; }
    public int getPredictorPoints() { return predictorPoints; }
    public int getOverallPoints() { return overallPoints; }
    public RankTier getTraderRank() { return traderRank; }
    public RankTier getPredictorRank() { return predictorRank; }
    public RankTier getOverallRank() { return overallRank; }
    public int getResolvedMarketsCount() { return resolvedMarketsCount; }

    public void setUserId(Long userId) { this.userId = userId; }
    public void setTraderPoints(int traderPoints) { this.traderPoints = traderPoints; }
    public void setPredictorPoints(int predictorPoints) { this.predictorPoints = predictorPoints; }
    public void setOverallPoints(int overallPoints) { this.overallPoints = overallPoints; }
    public void setTraderRank(RankTier traderRank) { this.traderRank = traderRank; }
    public void setPredictorRank(RankTier predictorRank) { this.predictorRank = predictorRank; }
    public void setOverallRank(RankTier overallRank) { this.overallRank = overallRank; }
    public void setResolvedMarketsCount(int resolvedMarketsCount) { this.resolvedMarketsCount = resolvedMarketsCount; }
}