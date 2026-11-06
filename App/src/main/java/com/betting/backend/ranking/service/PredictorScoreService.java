package com.betting.backend.ranking.service;

public interface PredictorScoreService {
    double processPredictionResolution(String userId, String marketId, boolean isCorrect, double wageredAmount);

    
}
