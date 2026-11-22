package com.betting.backend.trades;

import java.security.Principal;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import com.betting.backend.auth.ratelimit.FinancialRateLimiter;
import com.betting.backend.audit.AuditService;
import com.betting.backend.auth.ratelimit.PublicReadRateLimiter;
import com.betting.backend.config.PageResponse;
import jakarta.servlet.http.HttpServletRequest;
import com.betting.backend.security.IdempotencyKeyFactory;
import com.betting.backend.trades.dto.CreateTradeRequest;
import com.betting.backend.trades.dto.TradeResponse;
import com.betting.backend.user.User;
import com.betting.backend.user.UserRepository;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/trades")
public class TradeController {
    private final UserRepository userRepository;
    private final TradeService tradeService;
    private final FinancialRateLimiter rateLimiter;
    private final IdempotencyKeyFactory idempotencyKeys;
    private final AuditService auditService;
    private final PublicReadRateLimiter publicRateLimiter;
    public TradeController(TradeService tradeService,
                           UserRepository userRepository,
                           FinancialRateLimiter rateLimiter,
                           IdempotencyKeyFactory idempotencyKeys,
                           AuditService auditService,
                           PublicReadRateLimiter publicRateLimiter){
        this.tradeService=tradeService;
        this.userRepository = userRepository;
        this.rateLimiter = rateLimiter;
        this.idempotencyKeys = idempotencyKeys;
        this.auditService = auditService;
        this.publicRateLimiter = publicRateLimiter;
    }
    @PostMapping("/sell")
    public ResponseEntity<TradeResponse> createSellTrade(
    @Valid @RequestBody CreateTradeRequest request,
    @RequestHeader("Idempotency-Key") String clientKey,
    Principal principal
){
    String emailOrUsername = principal.getName();
    User user = userRepository.findByUsername(emailOrUsername)
            .orElseThrow(() -> new RuntimeException("User not found for: " + emailOrUsername));

        rateLimiter.checkTrade(user.getId());
    String key = idempotencyKeys.requireAndScope("trade-sell", user.getId(), clientKey);
    TradeResponse response = tradeService.createSellTrade(request, user, key);
        auditService.success(user.getId(), "TRADE_SELL", "TRADE",
            response.getId() != null ? response.getId().toString() : null);
    return ResponseEntity.status(HttpStatus.CREATED)
            .cacheControl(CacheControl.noStore())
            .header("Idempotency-Key", clientKey.trim())
            .body(response);
}
    @PostMapping("/buy")
    public ResponseEntity<TradeResponse> createBuyTrade(
        @Valid @RequestBody CreateTradeRequest request,
        @RequestHeader("Idempotency-Key") String clientKey,
        Principal principal
    ){
        String emailOrUsername = principal.getName();
        User user = userRepository.findByUsername(emailOrUsername)
                .orElseThrow(() -> new RuntimeException("User not found for: " + emailOrUsername));

        rateLimiter.checkTrade(user.getId());
        String key = idempotencyKeys.requireAndScope("trade-buy", user.getId(), clientKey);
        TradeResponse response = tradeService.createBuyTrade(request, user, key);
        auditService.success(user.getId(), "TRADE_BUY", "TRADE",
            response.getId() != null ? response.getId().toString() : null);
        return ResponseEntity.status(HttpStatus.CREATED)
            .cacheControl(CacheControl.noStore())
            .header("Idempotency-Key", clientKey.trim())
            .body(response);
    }
    @GetMapping("/{marketId}")
    public ResponseEntity<PageResponse<TradeResponse>> getTradesByMarketId(
        @PathVariable("marketId") UUID marketid,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        HttpServletRequest request

    ){
        publicRateLimiter.checkMarketList(request.getRemoteAddr());
        var result = tradeService.getTradesForMarket(marketid,
                PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100),
                        Sort.by(Sort.Direction.DESC, "createdAt")));
        return ResponseEntity.ok()
            .cacheControl(CacheControl.noStore())
            .body(PageResponse.from(result));
    }




}
