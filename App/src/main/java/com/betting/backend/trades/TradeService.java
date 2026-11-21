package com.betting.backend.trades;

import com.betting.backend.trades.dto.CreateTradeRequest;
import com.betting.backend.trades.dto.TradeResponse;
import java.util.*;
import com.betting.backend.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
public interface TradeService {

    TradeResponse createBuyTrade(CreateTradeRequest request, User currentUser, String idempotencyKey);

    List<TradeResponse> getTradesForUser(Long userId);
    List<TradeResponse> getTradesForUserInMarket(Long userId, UUID marketId);
    List<TradeResponse> getTradesForMarket(UUID marketId);
    Page<TradeResponse> getTradesForMarket(UUID marketId, Pageable pageable);
    List<TradeResponse> getTradesForOutcomeInMarket(UUID marketId, UUID outcomeId);

    TradeResponse createSellTrade(CreateTradeRequest request, User currentUser, String idempotencyKey);


}
