package com.betting.backend.ranking.service;

public interface TraderScoreService {
    double processTradeResolution(String userId, String marketId, double netProfitLoss);

}
