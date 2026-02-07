package com.betting.backend.markets;

import java.util.UUID;

public interface PricingService {
    int getSpotprice(UUID marketID, UUID outcomeID);
    long quoteBuyCost(UUID marketID, UUID outcomeID, int quantity);
    long quoteSellPayout(UUID marketID, UUID outcomeID, int quantity);


}
