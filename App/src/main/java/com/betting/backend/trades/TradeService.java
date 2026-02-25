package com.betting.backend.trades;

import com.betting.backend.trades.dto.CreateTradeRequest;
import com.betting.backend.trades.dto.TradeResponse;
import java.util.*;
import com.betting.backend.user.User;
public interface TradeService {

    TradeResponse createBuyTrade(CreateTradeRequest request, User currentUser);

    List<TradeResponse> getTradesForUser(Long userId);
    List<TradeResponse> getTradesForUserInMarket(Long userId, UUID marketId);
    List<TradeResponse> getTradesForMarket(UUID marketId);
    List<TradeResponse> getTradesForOutcomeInMarket(UUID marketId, UUID outcomeId);

    TradeResponse createSellTrade(CreateTradeRequest request, User currentUser); // TODO: implement later


}
