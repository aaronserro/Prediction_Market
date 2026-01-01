package com.betting.backend.markets;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.betting.backend.markets.dto.MarketCreateRequest;
import com.betting.backend.markets.dto.MarketResponse;
import com.betting.backend.markets.dto.UpdateMarketRequest;
@Service
public interface MarketService {

    MarketResponse createMarket(MarketCreateRequest request);

    MarketResponse getMarketById(UUID marketId);

    List<MarketResponse> getMarketsonStatus(MarketStatus status);

    List<MarketResponse> getAllMarkets(); // later: make this paginated

    List<MarketResponse> getMarketsByCategory(MarketCategory category);

    MarketResponse updateMarket(UUID marketId, UpdateMarketRequest request);


}
