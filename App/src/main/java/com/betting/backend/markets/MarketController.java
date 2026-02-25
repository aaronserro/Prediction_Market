package com.betting.backend.markets;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.betting.backend.markets.dto.MarketCreateRequest;
import com.betting.backend.markets.dto.MarketResponse;
import com.betting.backend.markets.dto.UpdateMarketRequest;

@RestController
@RequestMapping("/api/v1")
public class MarketController {

    private final MarketService marketService;
    private final PricingService pricingService;

    public MarketController(MarketService marketService, PricingService pricingService) {
        this.marketService = marketService;
        this.pricingService = pricingService;
    }

    // ========= ADMIN ENDPOINTS =========

    /**
     * Create a new market (ADMIN ONLY).
     * Example URL: POST /api/v1/admin/markets
     */
    @PostMapping("/admin/markets")
    public ResponseEntity<MarketResponse> createMarket(
            @RequestBody MarketCreateRequest request
    ) {
        MarketResponse response = marketService.createMarket(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    @PostMapping("/admin/markets/{marketId}/resolve")
    public ResponseEntity<Void> resolveMarket(
        @PathVariable UUID marketId,
        @RequestParam UUID winningOutcomeId
) {
    marketService.resolveMarket(marketId, winningOutcomeId);
    return ResponseEntity.noContent().build();
}

    /**
     * Update an existing market (ADMIN ONLY).
     * Example URL: PUT /api/v1/admin/markets/{marketId}
     */
    @PutMapping("/admin/markets/{marketId}")
    public ResponseEntity<MarketResponse> updateMarket(
        @PathVariable UUID marketId,
        @RequestBody UpdateMarketRequest request
    ) {
        MarketResponse updated = marketService.updateMarket(marketId, request);
        return ResponseEntity.ok(updated);
    }


    // ========= PUBLIC / USER ENDPOINTS =========

    /**
     * Get ALL markets (any status).
     * Example URL: GET /api/markets
     */
    @GetMapping("/markets")
    public List<MarketResponse> getAllMarkets() {
        return marketService.getAllMarkets();
    }

    /**
     * Get a single market by ID.
     * Example URL: GET /api/markets/{id}
     */
    @GetMapping("/markets/{id}")
    public MarketResponse getMarketById(@PathVariable("id") UUID marketId) {
        return marketService.getMarketById(marketId);
    }

    /**
     * Get all markets by status.
     * Example URL: GET /api/markets/status/ACTIVE
     *             GET /api/markets/status/UPCOMING
     */
    @GetMapping("/markets/status/{status}")
    public List<MarketResponse> getMarketsByStatus(
            @PathVariable("status") MarketStatus status
    ) {
        return marketService.getMarketsonStatus(status);
    }

    /**
     * Get all markets by category.
     * Example URL: GET /api/markets/category/SPORTS
     */
    @GetMapping("/markets/category/{category}")
    public List<MarketResponse> getMarketsByCategory(
            @PathVariable("category") MarketCategory category
    ) {
        return marketService.getMarketsByCategory(category);
    }

    /**
     * Get the current spot price for an outcome (0-100 cents).
     * Example URL: GET /api/markets/{marketId}/outcomes/{outcomeId}/price
     */
    @GetMapping("/markets/{marketId}/outcomes/{outcomeId}/price")
    public ResponseEntity<Integer> getOutcomePrice(
            @PathVariable("marketId") UUID marketId,
            @PathVariable("outcomeId") UUID outcomeId
    ) {
        int price = pricingService.getSpotprice(marketId, outcomeId);
        return ResponseEntity.ok(price);
    }

    /**
     * Get a quote for buying a specific quantity of an outcome.
     * Example URL: GET /api/markets/{marketId}/outcomes/{outcomeId}/quote?quantity=10
     */
    @GetMapping("/markets/{marketId}/outcomes/{outcomeId}/quote")
    public ResponseEntity<Long> getBuyQuote(
            @PathVariable("marketId") UUID marketId,
            @PathVariable("outcomeId") UUID outcomeId,
            @RequestParam("quantity") int quantity
    ) {
        long totalCost = pricingService.quoteBuyCost(marketId, outcomeId, quantity);
        return ResponseEntity.ok(totalCost);
    }
}
