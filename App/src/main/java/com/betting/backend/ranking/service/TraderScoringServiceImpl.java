package com.betting.backend.ranking.service;

import org.springframework.stereotype.Service;

import com.betting.backend.ranking.dto.UserMarketResult;

@Service
public class TraderScoringServiceImpl implements TraderScoringService{
    @Override
    public int calculateTraderPoints(UserMarketResult result){
    int realizedPnl = result.getRealizedPnl();
    int capitalRisked = result.getCapitalRisked();

    if (capitalRisked <= 0) {
        return 0;
    }

    double roi = (double) realizedPnl / capitalRisked;

    int points = (int) Math.round(roi * 100);

    // clamp points
    int MAX_POINTS = 150;
    int MIN_POINTS = -150;

    if (points > MAX_POINTS) {
        points = MAX_POINTS;
    }

    if (points < MIN_POINTS) {
        points = MIN_POINTS;
    }

    return points;

    }


}
