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
import com.betting.backend.wallet.Exceptions.WalletNotFoundException;
import com.betting.backend.wallet.Repository.WalletRepository;
import com.betting.backend.wallet.model.Wallet;

@Service
public class TradeServiceImpl implements TradeService {

    private final TradeRepo tradeRepo;
    private final OutcomeRepository outcomerepo;
    private final MarketRepository marketRepo;
    private final WalletRepository walletRepository;
    private final PositionService positionService;
    private final PricingService pricingService;
    public TradeServiceImpl(TradeRepo tradeRepo,
                            OutcomeRepository outcomeRepository,
                            MarketRepository marketRepository,
                            WalletRepository walletRepository,
                            PositionService positionService,
                            PricingService pricingService) {
        this.tradeRepo = tradeRepo;
        this.outcomerepo = outcomeRepository;
        this.marketRepo = marketRepository;
        this.walletRepository = walletRepository;
        this.positionService=positionService;
        this.pricingService=pricingService;
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

        // 4) Get price and compute total amount (temporary fixed price)
        //int pricePerShare = 10; // TEMPORARY placeholder price
        //int totalAmount = pricePerShare * quantity;
        long totalAmount = pricingService.quoteBuyCost(market.getId(), outcome.getId(), quantity);
        int pricePerShare = (int) Math.round((double) totalAmount / (double) quantity);

        // 5) Wallet / balance check
        Wallet wallet = walletRepository.findByUser_Id(currentUser.getId())
                .orElseThrow(() -> new WalletNotFoundException(currentUser.getId()));

        if (wallet.getBalanceCents() < totalAmount) {
            throw new IllegalStateException("Insufficient funds to execute trade");
        }

        wallet.setBalanceCents(wallet.getBalanceCents() - totalAmount);
        walletRepository.save(wallet);

         // 6) Create Trade entity
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
        positionService.applyBuy(currentUser, outcome.getId(), quantity, pricePerShare);
        outcome.incremementOutstanding(quantity);
        outcomerepo.save(outcome);



        // 7) Use the common mapper
        return toResponse(savedTrade);
    }
}
