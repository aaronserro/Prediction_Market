package com.betting.backend.ranking.service;

import java.util.List;
import java.util.UUID;

import com.betting.backend.ranking.dto.UserMarketResult;

public interface UserMarketResultBuilder {
    List<UserMarketResult> buildResults(UUID marketId);


}
