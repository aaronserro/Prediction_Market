package com.betting.backend.trades.dto;

import java.util.UUID;

public class CreateTradeRequest {

    private UUID marketId;
    private UUID outcomeId;
    private int quantity; // number of units/shares user wants to buy

    public UUID getMarketId() {
        return marketId;
    }

    public void setMarketId(UUID marketId) {
        this.marketId = marketId;
    }

    public UUID getOutcomeId() {
        return outcomeId;
    }

    public void setOutcomeId(UUID outcomeId) {
        this.outcomeId = outcomeId;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }
}
