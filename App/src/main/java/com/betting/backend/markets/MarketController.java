package com.betting.backend.markets;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.CacheControl;

import jakarta.servlet.http.HttpServletRequest;

import com.betting.backend.auth.ratelimit.AdminMarketRateLimiter;
import com.betting.backend.auth.ratelimit.PublicReadRateLimiter;
import com.betting.backend.audit.AuditService;
import com.betting.backend.config.PageResponse;
import java.util.concurrent.TimeUnit;
import com.betting.backend.markets.dto.MarketCreateRequest;
import com.betting.backend.markets.dto.MarketResponse;
import com.betting.backend.markets.dto.UpdateMarketRequest;
import com.betting.backend.user.User;

@RestController
@RequestMapping("/api/v1")
public class MarketController {

    private final MarketService marketService;
    private final PricingService pricingService;
    private final AdminMarketRateLimiter rateLimiter;
    private final AuditService auditService;
    private final PublicReadRateLimiter publicRateLimiter;

    public MarketController(MarketService marketService,
                            PricingService pricingService,
                            AdminMarketRateLimiter rateLimiter,
                            AuditService auditService,
                            PublicReadRateLimiter publicRateLimiter) {
        this.marketService = marketService;
        this.pricingService = pricingService;
        this.rateLimiter = rateLimiter;
        this.auditService = auditService;
        this.publicRateLimiter = publicRateLimiter;
    }

    // ========= ADMIN ENDPOINTS =========

    /**
     * Create a new market (ADMIN ONLY).
     * Example URL: POST /api/v1/admin/markets
     */
    @PostMapping("/admin/markets")
    public ResponseEntity<MarketResponse> createMarket(
            @RequestBody MarketCreateRequest request,
            @AuthenticationPrincipal User admin
    ) {
        rateLimiter.checkMarketWrite(admin.getId());
        MarketResponse response = marketService.createMarket(request);
        auditService.success(admin.getId(), "MARKET_CREATE", "MARKET",
            response.getId() != null ? response.getId().toString() : null);
        return ResponseEntity.status(HttpStatus.CREATED)
            .cacheControl(CacheControl.noStore()).body(response);
    }
    @PostMapping("/admin/markets/{marketId}/resolve")
    public ResponseEntity<Void> resolveMarket(
        @PathVariable UUID marketId,
        @RequestParam UUID winningOutcomeId,
        @AuthenticationPrincipal User admin
) {
    rateLimiter.checkMarketResolve(admin.getId());
    int unsettled = marketService.resolveMarket(marketId, winningOutcomeId);
    if (unsettled > 0) {
        throw new ResponseStatusException(HttpStatus.CONFLICT,
                unsettled + " position(s) could not be settled; retry resolving this market");
    }
    auditService.success(admin.getId(), "MARKET_RESOLVE", "MARKET", marketId.toString());
    return ResponseEntity.noContent().cacheControl(CacheControl.noStore()).build();
}

    /**
     * Update an existing market (ADMIN ONLY).
     * Example URL: PUT /api/v1/admin/markets/{marketId}
     */
    @PutMapping("/admin/markets/{marketId}")
    public ResponseEntity<MarketResponse> updateMarket(
        @PathVariable UUID marketId,
        @RequestBody UpdateMarketRequest request,
        @AuthenticationPrincipal User admin
    ) {
        rateLimiter.checkMarketWrite(admin.getId());
        MarketResponse updated = marketService.updateMarket(marketId, request);
        auditService.success(admin.getId(), "MARKET_UPDATE", "MARKET", marketId.toString());
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(updated);
    }


    // ========= PUBLIC / USER ENDPOINTS =========

    /**
     * Get ALL markets (any status).
     * Example URL: GET /api/markets
     */
    @GetMapping("/markets")
        public ResponseEntity<PageResponse<MarketResponse>> getAllMarkets(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) MarketStatus status,
            @RequestParam(required = false) MarketCategory category,
            HttpServletRequest request) {
        publicRateLimiter.checkMarketList(request.getRemoteAddr());
        var result = marketService.getMarkets(status, category,
            PageRequest.of(Math.max(page, 0), boundedSize(size),
                Sort.by(Sort.Direction.DESC, "startDate")));
        return ResponseEntity.ok()
            .cacheControl(CacheControl.maxAge(30, TimeUnit.SECONDS).cachePublic())
            .body(PageResponse.from(result));
    }

    /**
     * Get a single market by ID.
     * Example URL: GET /api/markets/{id}
     */
    @GetMapping("/markets/{id}")
    public ResponseEntity<MarketResponse> getMarketById(
            @PathVariable("id") UUID marketId, HttpServletRequest request) {
        publicRateLimiter.checkMarketList(request.getRemoteAddr());
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(30, TimeUnit.SECONDS).cachePublic())
                .body(marketService.getMarketById(marketId));
    }

    /**
     * Get all markets by status.
     * Example URL: GET /api/markets/status/ACTIVE
     *             GET /api/markets/status/UPCOMING
     */
    @GetMapping("/markets/status/{status}")
        public ResponseEntity<PageResponse<MarketResponse>> getMarketsByStatus(
            @PathVariable("status") MarketStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            HttpServletRequest request
    ) {
        publicRateLimiter.checkMarketList(request.getRemoteAddr());
        var result = marketService.getMarkets(status, null,
            PageRequest.of(Math.max(page, 0), boundedSize(size)));
        return ResponseEntity.ok()
            .cacheControl(CacheControl.maxAge(30, TimeUnit.SECONDS).cachePublic())
            .body(PageResponse.from(result));
    }

    /**
     * Get all markets by category.
     * Example URL: GET /api/markets/category/SPORTS
     */
    @GetMapping("/markets/category/{category}")
        public ResponseEntity<PageResponse<MarketResponse>> getMarketsByCategory(
            @PathVariable("category") MarketCategory category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            HttpServletRequest request
    ) {
        publicRateLimiter.checkMarketList(request.getRemoteAddr());
        var result = marketService.getMarkets(null, category,
            PageRequest.of(Math.max(page, 0), boundedSize(size)));
        return ResponseEntity.ok()
            .cacheControl(CacheControl.maxAge(30, TimeUnit.SECONDS).cachePublic())
            .body(PageResponse.from(result));
    }

    /**
     * Get the current spot price for an outcome (0-100 cents).
     * Example URL: GET /api/markets/{marketId}/outcomes/{outcomeId}/price
     */
    @GetMapping("/markets/{marketId}/outcomes/{outcomeId}/price")
    public ResponseEntity<Integer> getOutcomePrice(
            @PathVariable("marketId") UUID marketId,
            @PathVariable("outcomeId") UUID outcomeId,
            HttpServletRequest request
    ) {
        publicRateLimiter.checkQuote(request.getRemoteAddr());
        int price = pricingService.getSpotprice(marketId, outcomeId);
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(price);
    }

    /**
     * Get a quote for buying a specific quantity of an outcome.
     * Example URL: GET /api/markets/{marketId}/outcomes/{outcomeId}/quote?quantity=10
     */
    @GetMapping("/markets/{marketId}/outcomes/{outcomeId}/quote")
    public ResponseEntity<Long> getBuyQuote(
            @PathVariable("marketId") UUID marketId,
            @PathVariable("outcomeId") UUID outcomeId,
            @RequestParam("quantity") int quantity,
            HttpServletRequest request
    ) {
        publicRateLimiter.checkQuote(request.getRemoteAddr());
        long totalCost = pricingService.quoteBuyCost(marketId, outcomeId, quantity);
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(totalCost);
    }

    private int boundedSize(int requested) {
        return Math.min(Math.max(requested, 1), 100);
    }
}
