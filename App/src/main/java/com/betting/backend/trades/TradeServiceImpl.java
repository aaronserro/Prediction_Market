package com.betting.backend.trades;

import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.betting.backend.markets.MarketStatus;
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
import com.betting.backend.wallet.dto.TransactionResponse;

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
    public List<TradeResponse> getTradesForOutcomeInMarket(UUID marketId, UUID outcomeId) {
        return tradeRepo.findByMarketIdAndOutcomeId(marketId, outcomeId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // ---- Command method (create buy trade) ----
    @Transactional
    public TradeResponse createSellTrade(CreateTradeRequest request, User currentUser){
        if (request == null){
            throw new IllegalArgumentException("Trade request cannot be null");

        }
        if (request.getQuantity() <= 0) {
            throw new IllegalArgumentException("Quantity must be greater than zero");
        }
        Market market = marketRepo.findById(request.getMarketId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Market not found with id: " + request.getMarketId()));
        if (!MarketStatus.ACTIVE.equals(market.getStatus())) {
            throw new IllegalStateException("Market is not active for trading");
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
        /*
        System.out.println("DEBUG - Sell Trade Details:");
        System.out.println("  Quantity: " + quantity);
        System.out.println("  Total Amount (cents): " + totalAmount);
        System.out.println("  Price Per Share (cents): " + pricePerShare);
        System.out.println("  User: " + currentUser.getUsername());
        System.out.println("  Market: " + market.getTitle());
        System.out.println("  Outcome: " + outcome.getLabel());
        */
        // Update position first to validate user has enough shares
        positionService.applySel(currentUser, outcome.getId(), quantity, pricePerShare);

        // Update outstanding shares
        outcome.incremementOutstanding(-quantity);
        outcomerepo.save(outcome);
        outcomerepo.flush(); // Force immediate database update

        // Credit wallet using WalletService
        String idempotencyKey = "trade_sell_" + UUID.randomUUID().toString();
        String refId = "SELL:market=" + market.getId() + ",outcome=" + outcome.getId() + ",qty=" + quantity;
        TransactionResponse creditTx = walletService.credit(totalAmount, currentUser.getId(), idempotencyKey, refId);

        // Create trade record
        Trade trade = new Trade();
        trade.setUser(currentUser);
        trade.setMarket(market);
        trade.setOutcome(outcome);
        trade.setQuantity(quantity);
        trade.setPricePerShare(pricePerShare);
        trade.setTotalAmount(totalAmount);
        trade.setside(TradeSide.SELL);  // enum side
        trade.setUser(currentUser);
        Trade savedTrade = tradeRepo.save(trade);

        // Use the common mapper
        return toResponse(savedTrade);


    }

    @Transactional
    public TradeResponse createBuyTrade(CreateTradeRequest request, User currentUser) {
        if (request == null) {
            throw new IllegalArgumentException("Trade request cannot be null");
        }

        // 1) Basic validation on quantity
        if (request.getQuantity() <= 0) {
            throw new IllegalArgumentException("Quantity must be greater than zero");
        }

        // 2) Load Market
        Market market = marketRepo.findById(request.getMarketId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Market not found with id: " + request.getMarketId()));

        // 2b) Ensure market is ACTIVE
        if (!MarketStatus.ACTIVE.equals(market.getStatus())) {
            throw new IllegalStateException("Market is not active for trading");
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

        System.out.println("DEBUG - Buy Trade Details:");
        System.out.println("  Quantity: " + quantity);
        System.out.println("  Total Amount (cents): " + totalAmount);
        System.out.println("  Price Per Share (cents): " + pricePerShare);
        System.out.println("  User: " + currentUser.getUsername());
        System.out.println("  Market: " + market.getTitle());
        System.out.println("  Outcome: " + outcome.getLabel());

        // 5) Debit wallet using WalletService (this will validate sufficient funds)
        String idempotencyKey = "trade_buy_" + UUID.randomUUID().toString();
        String refId = "BUY:market=" + market.getId() + ",outcome=" + outcome.getId() + ",qty=" + quantity;
        TransactionResponse debitTx = walletService.debit(totalAmount, currentUser.getId(), idempotencyKey, refId);

        // 6) Update outstanding shares AFTER wallet is debited
        outcome.incremementOutstanding(quantity);
        outcomerepo.save(outcome);
        outcomerepo.flush(); // Force immediate database update

        Outcome reloaded = outcomerepo.findById(outcome.getId()).orElseThrow();
        System.out.println("DEBUG outstanding reloaded: " + reloaded.getOutstanding());
        int spotAfter = pricingService.getSpotprice(market.getId(), outcome.getId());
        System.out.println("DEBUG spot price after increment: " + spotAfter);

        // 7) Create Trade entity
        Trade trade = new Trade();
        trade.setUser(currentUser);
        trade.setMarket(market);
        trade.setOutcome(outcome);
        trade.setQuantity(quantity);
        trade.setPricePerShare(pricePerShare);
        trade.setTotalAmount(totalAmount);
        trade.setside(TradeSide.BUY);  // enum side
        trade.setUser(currentUser);
        Trade savedTrade = tradeRepo.save(trade);

        // 8) Update user's position
        positionService.applyBuy(currentUser, outcome.getId(), quantity, pricePerShare);

        // 9) Use the common mapper
        return toResponse(savedTrade);
    }
}
