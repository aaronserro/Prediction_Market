package com.betting.backend.ranking.service;

import org.springframework.stereotype.Service;

@Service
public class OverallScoringServiceImpl implements OverallScoringService{
    // V1 weights (easy to tune later)
    private static final double TRADER_WEIGHT = 0.55;
    private static final double PREDICTOR_WEIGHT = 0.45;
    @Override
    public int calculateOverallPoints(int traderPoints, int predictorPoints) {
        double overall = (TRADER_WEIGHT * traderPoints) + (PREDICTOR_WEIGHT * predictorPoints);
        return (int) Math.round(overall);
    }


}
