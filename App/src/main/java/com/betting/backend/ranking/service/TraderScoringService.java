package com.betting.backend.ranking.service;

import com.betting.backend.ranking.dto.UserMarketResult;

public interface TraderScoringService {
    int calculateTraderPoints(UserMarketResult result);

}
