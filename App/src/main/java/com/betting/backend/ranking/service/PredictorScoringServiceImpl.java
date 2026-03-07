package com.betting.backend.ranking.service;

import org.springframework.stereotype.Service;

import com.betting.backend.ranking.dto.UserMarketResult;

@Service
public class PredictorScoringServiceImpl implements PredictorScoringService{
    private static final int WIN_POINTS = 60;
    private static final int LOSS_POINTS = -40;

    public int calculatePredictorPoints(UserMarketResult result) {

        boolean won = result.isWon();
        double p = result.getFinalMarketProbability();

        // Guard probability bounds (in case pricing returns slightly out of range)
        if (p < 0.0) p = 0.0;
        if (p > 1.0) p = 1.0;

        // Difficulty ranges from 0.0 (easy, near 0 or 1) to 1.0 (hard, near 0.5)
        // difficulty = 1 - |0.5 - p| * 2
        double difficulty = 1.0 - (Math.abs(0.5 - p) * 2.0);

        // Extra guard for floating error
        if (difficulty < 0.0) difficulty = 0.0;
        if (difficulty > 1.0) difficulty = 1.0;

        int base = won ? WIN_POINTS : LOSS_POINTS;

        return (int) Math.round(base * difficulty);
    }



}
