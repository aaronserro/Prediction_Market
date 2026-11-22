package com.betting.backend.trades.dto;

import java.util.UUID;

import com.betting.backend.trades.TradeLimits;
import com.betting.backend.trades.TradeSide;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public class CreateTradeRequest {

    private UUID marketId;
    private UUID outcomeId;
    @Min(1)
    @Max(TradeLimits.MAX_QUANTITY)
    private int quantity; // number of units/shares user wants to buy
    private TradeSide side;
    public UUID getMarketId() {
        return marketId;
    }

    public void setMarketId(UUID marketId) {
        this.marketId = marketId;
    }

    public UUID getOutcomeId() {
        return outcomeId;
    }
    public TradeSide getSide(){
        return side;
    }
    public void setTradeSide(TradeSide side){
        this.side = side;
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
