package com.betting.backend.markets;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.betting.backend.markets.dto.MarketCreateRequest;
import com.betting.backend.markets.dto.MarketResponse;
@Service
public interface MarketService {

    MarketResponse createMarket(MarketCreateRequest request);

    MarketResponse getMarketById(UUID marketId);

    List<MarketResponse> getMarketsonStatus(MarketStatus status);

    List<MarketResponse> getAllMarkets(); // later: make this paginated

    List<MarketResponse> getMarketsByCategory(MarketCategory category);

}
