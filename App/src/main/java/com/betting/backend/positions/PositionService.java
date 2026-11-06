package com.betting.backend.positions;

import com.betting.backend.trades.dto.CreateTradeRequest;
import com.betting.backend.trades.dto.TradeResponse;
import java.util.*;
import com.betting.backend.user.User;
public interface PositionService {
    Position applyBuy(User user, UUID outcomeId, int qty, int buypriceCents);
    void applySel(User user, UUID outcomeId, int qty, int currentMarketprice);
    /** @return number of positions that failed to settle and remain OPEN */
    int settlePositions(UUID MarketID, UUID winningOutcomeID);

}