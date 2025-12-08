package com.betting.backend.markets;

import java.util.List;
import java.util.UUID;

import com.betting.backend.markets.dto.MarketCreateRequest;
import com.betting.backend.markets.dto.MarketResponse;

public interface MarketService {

    MarketResponse createMarket(MarketCreateRequest request);

    MarketResponse getMarketById(UUID marketId);

    List<MarketResponse> getActiveMarkets();

    List<MarketResponse> getAllMarkets(); // later: make this paginated

    List<MarketResponse> getMarketsByCategory(String category);

}
