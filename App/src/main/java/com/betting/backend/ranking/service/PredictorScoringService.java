package com.betting.backend.ranking.service;

import com.betting.backend.ranking.dto.UserMarketResult;

public interface PredictorScoringService {
    int calculatePredictorPoints(UserMarketResult result);

}
