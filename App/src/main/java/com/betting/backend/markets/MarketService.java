package com.betting.backend.markets;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

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

    Page<MarketResponse> getMarkets(MarketStatus status, MarketCategory category, Pageable pageable);

    MarketResponse updateMarket(UUID marketId, UpdateMarketRequest request);

    /** @return number of positions still unsettled (0 means the market is RESOLVED) */
    int resolveMarket(UUID marketId, UUID winningOutcomeId);


}
