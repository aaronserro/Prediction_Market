package com.betting.backend.trades;

import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.betting.backend.trades.dto.CreateTradeRequest;
import com.betting.backend.trades.dto.TradeResponse;
import com.betting.backend.user.User;
import com.betting.backend.markets.Market;
import com.betting.backend.markets.MarketRepository;
import com.betting.backend.markets.Outcome;
import com.betting.backend.markets.OutcomeRepository;
import com.betting.backend.markets.PricingService;
import com.betting.backend.positions.PositionService;
import com.betting.backend.wallet.Service.WalletService;
import com.betting.backend.wallet.Exceptions.DuplicateOperationException;

@Service
public class TradeServiceImpl implements TradeService {

    private final TradeRepo tradeRepo;
    private final OutcomeRepository outcomerepo;
    private final MarketRepository marketRepo;
    private final PositionService positionService;
    private final PricingService pricingService;
    private final WalletService walletService;

    public TradeServiceImpl(TradeRepo tradeRepo,
                            OutcomeRepository outcomeRepository,
                            MarketRepository marketRepository,
                            PositionService positionService,
                            PricingService pricingService,
                            WalletService walletService) {
        this.tradeRepo = tradeRepo;
        this.outcomerepo = outcomeRepository;
        this.marketRepo = marketRepository;
        this.positionService = positionService;
        this.pricingService = pricingService;
        this.walletService = walletService;
    }


    // ---- Mapping helper ----
    private TradeResponse toResponse(Trade trade) {
        TradeResponse response = new TradeResponse();
        response.setId(trade.getId());
        response.setCreatedAt(trade.getCreatedAt());

        response.setMarketId(trade.getMarket().getId());
        response.setMarketTitle(trade.getMarket().getTitle());

        response.setOutcomeId(trade.getOutcome().getId());
        response.setOutcomeName(trade.getOutcome().getLabel());

        response.setQuantity(trade.getQuantity());
        response.setPricePerShare(trade.getPricePerShare());
        response.setTotalAmount(trade.getTotalAmount());
        response.setUser(trade.getUser().getUsername());

        response.setSide(trade.getside());
        // If TradeResponse has a side field:
        // response.setSide(trade.getSide());

        // If you later add walletBalanceAfterTrade:
        // response.setWalletBalanceAfterTrade(...);

        return response;
    }

    // ---- Query methods now return DTOs ----

    @Override
    public List<TradeResponse> getTradesForUser(Long userId) {
        return tradeRepo.findByUserId(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public List<TradeResponse> getTradesForUserInMarket(Long userId, UUID marketId) {
        return tradeRepo.findByUserIdAndMarketId(userId, marketId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public List<TradeResponse> getTradesForMarket(UUID marketId) {
        return tradeRepo.findByMarketId(marketId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<TradeResponse> getTradesForMarket(
            UUID marketId, org.springframework.data.domain.Pageable pageable) {
        return tradeRepo.findByMarketId(marketId, pageable).map(this::toResponse);
    }

    @Override
    public List<TradeResponse> getTradesForOutcomeInMarket(UUID marketId, UUID outcomeId) {
        return tradeRepo.findByMarketIdAndOutcomeId(marketId, outcomeId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // ---- Command method (create buy trade) ----
    @Transactional
    public TradeResponse createSellTrade(
            CreateTradeRequest request, User currentUser, String idempotencyKey){
        validateCommand(request, currentUser, idempotencyKey);
        Trade replay = findReplay(request, currentUser, TradeSide.SELL, idempotencyKey);
        if (replay != null) {
            return toResponse(replay);
        }
        Market market = marketRepo.findByIdForUpdate(request.getMarketId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Market not found with id: " + request.getMarketId()));
        if (!market.isActive()) {
            throw new IllegalStateException("Market is not active for trading");
        }
        replay = findReplay(request, currentUser, TradeSide.SELL, idempotencyKey);
        if (replay != null) {
            return toResponse(replay);
        }
        Outcome outcome = outcomerepo.findById(request.getOutcomeId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Outcome not found with id: " + request.getOutcomeId()));

        if (!outcome.getMarket().getId().equals(market.getId())) {
            throw new IllegalArgumentException("Outcome does not belong to the specified market");
        }

        int quantity = request.getQuantity();
        long totalAmount = pricingService.quoteSellPayout(market.getId(), outcome.getId(), quantity);
        int pricePerShare = (int) Math.round((double) totalAmount / (double) quantity);
        // Update position first to validate user has enough shares
        positionService.applySell(currentUser, outcome.getId(), quantity, totalAmount);

        // Update outstanding shares
        outcome.incremementOutstanding(-quantity);
        outcomerepo.save(outcome);
        outcomerepo.flush(); // Force immediate database update

        // Credit wallet using WalletService
        String refId = "SELL:market=" + market.getId() + ",outcome=" + outcome.getId() + ",qty=" + quantity;
        walletService.credit(
            totalAmount, currentUser.getId(), idempotencyKey + ":wallet", refId);

        // Create trade record
        Trade trade = new Trade();
        trade.setUser(currentUser);
        trade.setMarket(market);
        trade.setOutcome(outcome);
        trade.setQuantity(quantity);
        trade.setPricePerShare(pricePerShare);
        trade.setTotalAmount(totalAmount);
        trade.setside(TradeSide.SELL);  // enum side
        trade.setIdempotencyKey(idempotencyKey);
        Trade savedTrade = tradeRepo.saveAndFlush(trade);

        // Use the common mapper
        return toResponse(savedTrade);


    }

    @Transactional
    public TradeResponse createBuyTrade(
            CreateTradeRequest request, User currentUser, String idempotencyKey) {
        validateCommand(request, currentUser, idempotencyKey);
        Trade replay = findReplay(request, currentUser, TradeSide.BUY, idempotencyKey);
        if (replay != null) {
            return toResponse(replay);
        }

        // 2) Load Market
        Market market = marketRepo.findByIdForUpdate(request.getMarketId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Market not found with id: " + request.getMarketId()));

        // 2b) Ensure market is ACTIVE
        if (!market.isActive()) {
            throw new IllegalStateException("Market is not active for trading");
        }
        replay = findReplay(request, currentUser, TradeSide.BUY, idempotencyKey);
        if (replay != null) {
            return toResponse(replay);
        }

        // 3) Load Outcome and ensure it belongs to the same market
        Outcome outcome = outcomerepo.findById(request.getOutcomeId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Outcome not found with id: " + request.getOutcomeId()));

        if (!outcome.getMarket().getId().equals(market.getId())) {
            throw new IllegalArgumentException("Outcome does not belong to the specified market");
        }

        int quantity = request.getQuantity();

        // 4) Get price and compute total amount
        long totalAmount = pricingService.quoteBuyCost(market.getId(), outcome.getId(), quantity);
        int pricePerShare = (int) Math.round((double) totalAmount / (double) quantity);

        // 5) Debit wallet using WalletService (this will validate sufficient funds)
        String refId = "BUY:market=" + market.getId() + ",outcome=" + outcome.getId() + ",qty=" + quantity;
        walletService.debit(
            totalAmount, currentUser.getId(), idempotencyKey + ":wallet", refId);

        // 6) Update outstanding shares AFTER wallet is debited
        outcome.incremementOutstanding(quantity);
        outcomerepo.save(outcome);
        outcomerepo.flush(); // Force immediate database update

        // 7) Create Trade entity
        Trade trade = new Trade();
        trade.setUser(currentUser);
        trade.setMarket(market);
        trade.setOutcome(outcome);
        trade.setQuantity(quantity);
        trade.setPricePerShare(pricePerShare);
        trade.setTotalAmount(totalAmount);
        trade.setside(TradeSide.BUY);  // enum side
        trade.setIdempotencyKey(idempotencyKey);
        Trade savedTrade = tradeRepo.saveAndFlush(trade);

        // 8) Update user's position
        positionService.applyBuy(currentUser, outcome.getId(), quantity, totalAmount);

        // 9) Use the common mapper
        return toResponse(savedTrade);
    }

    private void validateCommand(
            CreateTradeRequest request, User currentUser, String idempotencyKey) {
        if (request == null) {
            throw new IllegalArgumentException("Trade request cannot be null");
        }
        if (currentUser == null || currentUser.getId() == null) {
            throw new IllegalArgumentException("Authenticated user is required");
        }
        if (request.getMarketId() == null || request.getOutcomeId() == null) {
            throw new IllegalArgumentException("Market and outcome are required");
        }
        TradeLimits.requireValidQuantity(request.getQuantity());
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            throw new IllegalArgumentException("Idempotency-Key is required");
        }
        if (idempotencyKey.length() > 128) {
            throw new IllegalArgumentException("Idempotency-Key must not exceed 128 characters");
        }
    }

    private Trade findReplay(
            CreateTradeRequest request,
            User currentUser,
            TradeSide side,
            String idempotencyKey) {
        Trade existing = tradeRepo.findByIdempotencyKey(idempotencyKey).orElse(null);
        if (existing == null) {
            return null;
        }

        boolean matches = existing.getUser().getId().equals(currentUser.getId())
                && existing.getside() == side
                && existing.getMarket().getId().equals(request.getMarketId())
                && existing.getOutcome().getId().equals(request.getOutcomeId())
                && existing.getQuantity() == request.getQuantity();
        if (matches) {
            return existing;
        }
        throw new DuplicateOperationException(
                idempotencyKey,
                "TRADE_" + side,
                "Idempotency key already used for a different trade");
    }
}
