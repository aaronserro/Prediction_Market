package com.betting.backend.trades;

import com.betting.backend.markets.Market;
import com.betting.backend.markets.Outcome;
import com.betting.backend.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TradeRepo extends JpaRepository<Trade, Long> {

    // 1) Find all trades for a user
    List<Trade> findByUser(User user);
    // or, if you prefer working with IDs in services:
    List<Trade> findByUserId(Long userId);

    // 2) Find all trades for a market
    List<Trade> findByMarket(Market market);
    List<Trade> findByMarketId(UUID marketId);

    // 3) Find all trades for a user in a given market
    List<Trade> findByUserAndMarket(User user, Market market);
    List<Trade> findByUserIdAndMarketId(Long userId, UUID marketId);

    // 4) Find all trades for an outcome in a given market
    List<Trade> findByMarketAndOutcome(Market market, Outcome outcome);
    List<Trade> findByMarketIdAndOutcomeId(UUID marketId, UUID outcomeId);
}
