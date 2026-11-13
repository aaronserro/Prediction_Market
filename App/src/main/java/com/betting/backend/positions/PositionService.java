package com.betting.backend.positions;

import java.util.*;
import com.betting.backend.user.User;
public interface PositionService {
    Position applyBuy(User user, UUID outcomeId, int qty, long totalCostCents);
    void applySell(User user, UUID outcomeId, int qty, long totalProceedsCents);
    /** @return number of positions that failed to settle and remain OPEN */
    int settlePositions(UUID MarketID, UUID winningOutcomeID);

}