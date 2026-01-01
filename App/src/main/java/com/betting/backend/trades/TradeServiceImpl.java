package com.betting.backend.trades;
import java.util.*;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.betting.backend.markets.MarketStatus;
import com.betting.backend.trades.dto.CreateTradeRequest;
import com.betting.backend.trades.dto.TradeResponse;
import com.betting.backend.user.User;
import com.betting.backend.trades.TradeRepo;
import com.betting.backend.markets.Market;
import com.betting.backend.markets.MarketRepository;
import com.betting.backend.markets.Outcome;
import com.betting.backend.markets.OutcomeRepository;
import com.betting.backend.trades.Trade;
import com.betting.backend.wallet.Exceptions.WalletNotFoundException;
import com.betting.backend.wallet.Repository.WalletRepository;
import com.betting.backend.wallet.model.Wallet;
@Service
public class TradeServiceImpl implements TradeService {
    private final TradeRepo tradeRepo;
    private final OutcomeRepository outcomerepo;
    private final MarketRepository marketRepo;
    private final WalletRepository walletRepository;
    public TradeServiceImpl(TradeRepo tradeRepo,
        OutcomeRepository outcomeRepository,
        MarketRepository marketRepository,
        WalletRepository walletRepository) {
        this.tradeRepo = tradeRepo;
        this.outcomerepo=outcomeRepository;
        this.marketRepo=marketRepository;
        this.walletRepository = walletRepository;
    }

    @Override
    public List<Trade> getTradesForUser(Long userId) {
        // delegate directly to the repository
        return tradeRepo.findByUserId(userId);
    }

    @Override
    public List<Trade> getTradesForUserInMarket(Long userId, UUID marketId) {
        // delegate directly to the repository
        return tradeRepo.findByUserIdAndMarketId(userId, marketId);
    }

    @Override
    public List<Trade> getTradesForMarket(UUID marketId) {
        // delegate directly to the repository
        return tradeRepo.findByMarketId(marketId);
    }

    @Override
    public List<Trade> getTradesForOutcomeInMarket(UUID marketId, UUID outcomeId) {
        // delegate directly to the repository
        return tradeRepo.findByMarketIdAndOutcomeId(marketId, outcomeId);
    }
    @Transactional
    public TradeResponse createBuyTrade(CreateTradeRequest request, User currentUser){
        if (request == null) {
            throw new IllegalArgumentException("Trade request cannot be null");
        }
    // 1) Basic validation on   quantity
    if (request.getQuantity() <= 0) {
        throw new IllegalArgumentException("Quantity must be greater than zero");
    }

    // 2) Load Market
    Market market = marketRepo.findById(request.getMarketId())
            .orElseThrow(() -> new IllegalArgumentException("Market not found with id: " + request.getMarketId()));

    // (Optional, but recommended) ensure market is ACTIVE
        if (!MarketStatus.ACTIVE.equals(market.getStatus())) {
            throw new IllegalStateException("Market is not active for trading");
        }

    // 3) Load Outcome and ensure it belongs to the same market
    Outcome outcome = outcomerepo.findById(request.getOutcomeId())
            .orElseThrow(() -> new IllegalArgumentException("Outcome not found with id: " + request.getOutcomeId()));

    if (!outcome.getMarket().getId().equals(market.getId())) {
        throw new IllegalArgumentException("Outcome does not belong to the specified market");
    }

    int quantity = request.getQuantity();

    // 4) Get price and compute total amount
    // TODO: Replace this with a real AMM/pricing call later, e.g.:
    // PriceQuote quote = pricingService.getBuyQuote(market, outcome, quantity);
    // int pricePerShare = quote.getPricePerShare();
    // int totalAmount = quote.getTotalCost();

        int pricePerShare = 10; // TEMPORARY placeholder price
        int totalAmount = pricePerShare * quantity;
        Optional<Wallet> wallet = walletRepository.findByUser_Id(currentUser.getId());
        if(wallet.isEmpty()){
            throw new WalletNotFoundException(currentUser.getId());
        }
        if (wallet.get().getBalanceCents()<totalAmount){
            throw new IllegalStateException("Insufficient funds to execute trade");

        }
        wallet.get().setBalanceCents(wallet.get().getBalanceCents()-totalAmount);
        walletRepository.save(wallet.get());

    // 5) Wallet / balance check (TODO: hook into your real wallet system)
    // Example if you later have something like currentUser.getBalance():
    //
    // if (currentUser.getBalance() < totalAmount) {
    //     throw new IllegalStateException("Insufficient funds to execute trade");
    // }
    // currentUser.setBalance(currentUser.getBalance() - totalAmount);
    // userRepo.save(currentUser);

    // 6) Create Trade entity
    Trade trade = new Trade();
    trade.setUser(currentUser);
    trade.setMarket(market);
    trade.setOutcome(outcome);
    trade.setQuantity(quantity);
    trade.setPricePerShare(pricePerShare);
    trade.setTotalAmount(totalAmount);
    // createdAt is set automatically via @PrePersist in the entity
    trade.setside(TradeSide.BUY);
    Trade savedTrade = tradeRepo.save(trade);

    // 7) Map to TradeResponse DTO
    TradeResponse response = new TradeResponse();
    response.setId(savedTrade.getId());
    response.setMarketId(market.getId());
    response.setMarketTitle(market.getTitle());        // adjust if your field is named differently
    response.setOutcomeId(outcome.getId());
    response.setOutcomeName(outcome.getLabel());        // adjust if your field is named differently
    response.setQuantity(savedTrade.getQuantity());
    response.setPricePerShare(savedTrade.getPricePerShare());
    response.setTotalAmount(savedTrade.getTotalAmount());
    response.setCreatedAt(savedTrade.getCreatedAt());

    return response;
}






}
