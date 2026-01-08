// File: src/main/java/com/betting/backend/positions/dto/PositionResponse.java
package com.betting.backend.positions;

import java.util.UUID;

/**
 * What the frontend needs to render a user's portfolio row.
 * All *_Cents fields are in cents to avoid floating point issues.
 */
public class PositionResponse {

    private UUID marketId;
    private UUID outcomeId;
    private String outcomeName;

    private int quantity;

    private long costBasisCents;        // total paid for currently held shares
    private long avgBuyPriceCents;      // costBasisCents / quantity (0 if quantity=0)

    private long currentPriceCents;     // from PricingService
    private long marketValueCents;      // quantity * currentPriceCents

    private long unrealizedPnlCents;    // marketValueCents - costBasisCents
    private long realizedPnlCents;      // stored on Position (nullable safe)

    public PositionResponse() {}

    public PositionResponse(UUID marketId,
                            UUID outcomeId,
                            String outcomeName,
                            int quantity,
                            long costBasisCents,
                            long avgBuyPriceCents,
                            long currentPriceCents,
                            long marketValueCents,
                            long unrealizedPnlCents,
                            long realizedPnlCents) {
        this.marketId = marketId;
        this.outcomeId = outcomeId;
        this.outcomeName = outcomeName;
        this.quantity = quantity;
        this.costBasisCents = costBasisCents;
        this.avgBuyPriceCents = avgBuyPriceCents;
        this.currentPriceCents = currentPriceCents;
        this.marketValueCents = marketValueCents;
        this.unrealizedPnlCents = unrealizedPnlCents;
        this.realizedPnlCents = realizedPnlCents;
    }

    public UUID getMarketId() { return marketId; }
    public void setMarketId(UUID marketId) { this.marketId = marketId; }

    public UUID getOutcomeId() { return outcomeId; }
    public void setOutcomeId(UUID outcomeId) { this.outcomeId = outcomeId; }

    public String getOutcomeName() { return outcomeName; }
    public void setOutcomeName(String outcomeName) { this.outcomeName = outcomeName; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }

    public long getCostBasisCents() { return costBasisCents; }
    public void setCostBasisCents(long costBasisCents) { this.costBasisCents = costBasisCents; }

    public long getAvgBuyPriceCents() { return avgBuyPriceCents; }
    public void setAvgBuyPriceCents(long avgBuyPriceCents) { this.avgBuyPriceCents = avgBuyPriceCents; }

    public long getCurrentPriceCents() { return currentPriceCents; }
    public void setCurrentPriceCents(long currentPriceCents) { this.currentPriceCents = currentPriceCents; }

    public long getMarketValueCents() { return marketValueCents; }
    public void setMarketValueCents(long marketValueCents) { this.marketValueCents = marketValueCents; }

    public long getUnrealizedPnlCents() { return unrealizedPnlCents; }
    public void setUnrealizedPnlCents(long unrealizedPnlCents) { this.unrealizedPnlCents = unrealizedPnlCents; }

    public long getRealizedPnlCents() { return realizedPnlCents; }
    public void setRealizedPnlCents(long realizedPnlCents) { this.realizedPnlCents = realizedPnlCents; }
}
