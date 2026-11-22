package com.betting.backend.markets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.betting.backend.trades.TradeLimits;

class PricingServiceImplTest {

    private MarketRepository markets;
    private OutcomeRepository outcomes;
    private PricingServiceImpl pricing;
    private UUID marketId;
    private Outcome target;

    @BeforeEach
    void setUp() {
        markets = mock(MarketRepository.class);
        outcomes = mock(OutcomeRepository.class);
        pricing = new PricingServiceImpl(markets, outcomes);
        marketId = UUID.randomUUID();

        Market market = new Market();
        market.setId(marketId);
        target = outcome(market, UUID.randomUUID());
        Outcome other = outcome(market, UUID.randomUUID());
        when(markets.findById(marketId)).thenReturn(Optional.of(market));
        when(outcomes.findByMarketId(marketId)).thenReturn(List.of(target, other));
    }

    @Test
    void quoteBoundariesAreAcceptedAndSimulatedStateIsRestored() {
        assertThat(pricing.quoteBuyCost(marketId, target.getId(), 1)).isGreaterThanOrEqualTo(0L);
        assertThat(target.getOutstanding()).isZero();

        assertThat(pricing.quoteBuyCost(
                marketId, target.getId(), TradeLimits.MAX_QUANTITY)).isGreaterThanOrEqualTo(0L);
        assertThat(target.getOutstanding()).isZero();
    }

    @Test
    void quoteRejectsQuantitiesOutsideSharedBounds() {
        assertThatThrownBy(() -> pricing.quoteBuyCost(marketId, target.getId(), 0))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> pricing.quoteBuyCost(
                marketId, target.getId(), TradeLimits.MAX_QUANTITY + 1))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void quoteRejectsOutstandingOverflowWithoutChangingState() {
        target.incremementOutstanding(Integer.MAX_VALUE);

        assertThatThrownBy(() -> pricing.quoteBuyCost(marketId, target.getId(), 1))
                .isInstanceOf(ArithmeticException.class);
        assertThat(target.getOutstanding()).isEqualTo(Integer.MAX_VALUE);
    }

    private static Outcome outcome(Market market, UUID id) {
        Outcome outcome = new Outcome();
        outcome.setId(id);
        outcome.setMarket(market);
        return outcome;
    }
}