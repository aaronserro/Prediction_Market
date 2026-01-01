package com.betting.backend.trades;

import com.betting.backend.trades.dto.CreateTradeRequest;
import com.betting.backend.trades.dto.TradeResponse;
import java.util.*;
import com.betting.backend.user.User;
public interface TradeService {
        // 1) BUY side: main method you implement now
    TradeResponse createBuyTrade(CreateTradeRequest request, User currentUser);

    // 2) Read operations (history / stats inputs)
    List<Trade> getTradesForUser(Long userId);
    List<Trade> getTradesForUserInMarket(Long userId, UUID marketId);
    List<Trade> getTradesForMarket(UUID marketId);
    List<Trade> getTradesForOutcomeInMarket(UUID marketId, UUID outcomeId);

    // 3) SELL side: plan now, implement later
    //TradeResponse createSellTrade(CreateSellTradeRequest request, User currentUser); // TODO: implement later


}
