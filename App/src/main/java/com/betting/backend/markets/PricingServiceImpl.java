package com.betting.backend.markets;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
@Service
public class PricingServiceImpl implements PricingService{
    private final MarketRepository marketRepository;
    private final OutcomeRepository outcomeRepository;
    public PricingServiceImpl(MarketRepository marketRepository, OutcomeRepository outcomeRepository){
        this.marketRepository = marketRepository;
        this.outcomeRepository = outcomeRepository;
    }
    public int getSpotprice(UUID marketId, UUID outcomeId){
        if (marketId == null) throw new IllegalArgumentException("marketId cannot be null");
        if (outcomeId == null) throw new IllegalArgumentException("outcomeId cannot be null");
        Market market = marketRepository.findById(marketId)
                .orElseThrow(() -> new IllegalArgumentException("Market not found: " + marketId));

        int b = market.getLiquidityB();
        if (b < 1) {
            throw new IllegalStateException("Invalid liquidityB for market " + marketId + ": " + b);
        }
        List<Outcome> outcomes = outcomeRepository.findByMarketId(marketId);
        if (outcomes == null || outcomes.isEmpty()) {
            throw new IllegalStateException("No outcomes found for market: " + marketId);
        }
        if (outcomes.size() < 2) {
            throw new IllegalStateException("Market must have at least 2 outcomes to price. Market=" + marketId);
        }
        boolean foundRequested = false;
        for (Outcome o : outcomes) {
            if (o == null) continue;
            if (outcomeId.equals(o.getId())) foundRequested = true;

            int q = o.getOutstanding();
            // Note: for a new market, q can legitimately be 0.
            if (q < 0) {
                throw new IllegalStateException("sharesOutstanding cannot be negative. outcome=" + o.getId() + " q=" + q);
            }
        }
        if (!foundRequested) {
            throw new IllegalArgumentException("Outcome " + outcomeId + " does not belong to market " + marketId);
        }
        double maxX = Double.NEGATIVE_INFINITY;
        double targetX = 0.0;

        for (Outcome o : outcomes) {
            double x = ((double) o.getOutstanding()) / (double) b;
            if (x > maxX) maxX = x;
            if (outcomeId.equals(o.getId())) targetX = x;
        }
        double denom = 0.0;
        for (Outcome o : outcomes) {
            double x = ((double) o.getOutstanding()) / (double) b;
            denom += Math.exp(x - maxX);
        }
        double num = Math.exp(targetX - maxX);

        if (denom <= 0.0 || Double.isNaN(denom) || Double.isInfinite(denom)) {
            throw new IllegalStateException("Invalid LMSR denominator for market " + marketId + ": " + denom);
        }

        double p = num / denom; // 0..1
        int cents = (int) Math.round(p * 100.0);
        if (cents < 0) cents = 0;
        if (cents > 100) cents = 100;

        return cents;


    }
    public long quoteBuyCost(UUID marketId, UUID outcomeId, int quantity){

        if (marketId == null) throw new IllegalArgumentException("marketId cannot be null");
        if (outcomeId == null) throw new IllegalArgumentException("outcomeId cannot be null");
        if (quantity <= 0) throw new IllegalArgumentException("quantity must be > 0");
        Market market = marketRepository.findById(marketId)
        .orElseThrow(() -> new IllegalArgumentException("Market not found: " + marketId));

        int b = market.getLiquidityB();
        if (b < 1) throw new IllegalStateException("Invalid liquidityB for market " + marketId + ": " + b);


        List<Outcome> outcomes = outcomeRepository.findByMarketId(marketId);
        Outcome target = outcomes.stream()
        .filter(o -> outcomeId.equals(o.getId()))
        .findFirst()
        .orElseThrow(() -> new IllegalArgumentException("Outcome " + outcomeId + " does not belong to market " + marketId));

        double before = lmsrCost(outcomes, b);
        // simulate q_i += quantity (in-memory only)
        int oldQ = target.getOutstanding();
        target.incremementOutstanding(quantity);
        double after = lmsrCost(outcomes, b);

        // restore (important: do not mutate state permanently in a quote)
        target.incremementOutstanding(-quantity);

        long cents = Math.round((after - before) * 100.0);
        if (cents < 0) cents = 0; // defensive
        return cents;


    }
    public long quoteSellPayout(UUID marketId, UUID outcomeId, int quantity){
        if (marketId == null) throw new IllegalArgumentException("marketId cannot be null");
        if (outcomeId == null) throw new IllegalArgumentException("outcomeId cannot be null");
        if (quantity <= 0) throw new IllegalArgumentException("quantity must be > 0");
        Market market = marketRepository.findById(marketId)
            .orElseThrow(() -> new IllegalArgumentException("Market not found: " + marketId));

        int b = market.getLiquidityB();
        if (b < 1) throw new IllegalStateException("Invalid liquidityB for market " + marketId + ": " + b);
        List<Outcome> outcomes = outcomeRepository.findByMarketId(marketId);
        Outcome target = outcomes.stream()
        .filter(o -> outcomeId.equals(o.getId()))
        .findFirst()
        .orElseThrow(() -> new IllegalArgumentException("Outcome " + outcomeId + " does not belong to market " + marketId));


        int oldQ = target.getOutstanding();
        if (quantity > oldQ) {
            throw new IllegalArgumentException("Cannot sell more than outstanding in outcome. outstanding=" + oldQ + " sell=" + quantity);
        }

        double before = lmsrCost(outcomes, b);

        // simulate q_i -= quantity
        target.incremementOutstanding(-quantity);

        double after = lmsrCost(outcomes, b);

        // restore
        target.incremementOutstanding(quantity);
        long cents = Math.round((before - after) * 100.0);
        if (cents < 0) cents = 0;
        return cents;

    }

    private static double lmsrCost(List<Outcome> outcomes, int b) {
        double maxX = Double.NEGATIVE_INFINITY;
        for (Outcome o : outcomes) {
            double x = ((double) o.getOutstanding()) / (double) b;
            if (x > maxX) maxX = x;
        }

        double sum = 0.0;
        for (Outcome o : outcomes) {
            double x = ((double) o.getOutstanding()) / (double) b;
            sum += Math.exp(x - maxX);
        }

        return b * (Math.log(sum) + maxX); // log-sum-exp trick
    }

}
