package com.betting.backend.ranking.dto;

import java.util.UUID;

public class UserMarketResult {
    private long userId;
    private UUID marketId;

    private boolean won;

    private int realizedPnl;
    private int capitalRisked;

    private double finalMarketProbability;

    public UserMarketResult(Long userId,
                            UUID marketId,
                            boolean won,
                            int realizedPnl,
                            int capitalRisked,
                            double finalMarketProbability) {
        this.userId = userId;
        this.marketId = marketId;
        this.won = won;
        this.realizedPnl = realizedPnl;
        this.capitalRisked = capitalRisked;
        this.finalMarketProbability = finalMarketProbability;
    }

    public long getUserId() {
        return userId;
    }

    public void setUserId(long userId) {
        this.userId = userId;
    }

    public UUID getMarketId() {
        return marketId;
    }

    public void setMarketId(UUID marketId) {
        this.marketId = marketId;
    }

    public boolean isWon() {
        return won;
    }

    public void setWon(boolean won) {
        this.won = won;
    }

    public int getRealizedPnl() {
        return realizedPnl;
    }

    public void setRealizedPnl(int realizedPnl) {
        this.realizedPnl = realizedPnl;
    }

    public int getCapitalRisked() {
        return capitalRisked;
    }

    public void setCapitalRisked(int capitalRisked) {
        this.capitalRisked = capitalRisked;
    }

    public double getFinalMarketProbability() {
        return finalMarketProbability;
    }

    public void setFinalMarketProbability(double finalMarketProbability) {
        this.finalMarketProbability = finalMarketProbability;
    }

}
