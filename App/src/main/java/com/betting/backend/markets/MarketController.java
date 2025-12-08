package com.betting.backend.markets;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.betting.backend.markets.dto.MarketCreateRequest;
import com.betting.backend.markets.dto.MarketResponse;

@RestController
@RequestMapping("/api/v1")
public class MarketController {

    private final MarketService marketService;

    public MarketController(MarketService marketService) {
        this.marketService = marketService;
    }

    // ========= ADMIN ENDPOINTS =========

    /**
     * Create a new market (ADMIN ONLY).
     * Example URL: POST /api/admin/markets
     */
    @PostMapping("/admin/markets")
    public ResponseEntity<MarketResponse> createMarket(
            @RequestBody MarketCreateRequest request
    ) {
        // TODO: enforce admin role via Spring Security
        MarketResponse response = marketService.createMarket(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
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
}
