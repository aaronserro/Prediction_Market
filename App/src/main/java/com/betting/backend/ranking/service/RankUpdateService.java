package com.betting.backend.ranking.service;

import java.util.UUID;

public interface RankUpdateService {
    void processMarketResolution(UUID marketId);

}
