package com.betting.backend.markets;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.transaction.PlatformTransactionManager;

import com.betting.backend.markets.dto.UpdateMarketRequest;
import com.betting.backend.positions.PositionRepository;
import com.betting.backend.positions.PositionService;

class MarketUpdateGuardTest {

    private final MarketRepository markets = mock(MarketRepository.class);
    private final MarketServiceImpl service = new MarketServiceImpl(
            markets,
            mock(OutcomeRepository.class),
            mock(PositionService.class),
            mock(PositionRepository.class),
            mock(PlatformTransactionManager.class));

    @Test
    void settingStatusToResolvedViaEditIsRejected() {
        UUID id = UUID.randomUUID();
        when(markets.findById(id)).thenReturn(Optional.of(market(id, MarketStatus.CLOSED)));
        UpdateMarketRequest request = new UpdateMarketRequest();
        request.setStatus(MarketStatus.RESOLVED);

        assertThatThrownBy(() -> service.updateMarket(id, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Resolve");
        verify(markets, never()).save(any());
    }

    @Test
    void editingResolvedMarketIsRejected() {
        UUID id = UUID.randomUUID();
        when(markets.findById(id)).thenReturn(Optional.of(market(id, MarketStatus.RESOLVED)));
        UpdateMarketRequest request = new UpdateMarketRequest();
        request.setTitle("new title");

        assertThatThrownBy(() -> service.updateMarket(id, request))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("cannot be edited");
        verify(markets, never()).save(any());
    }

    private static Market market(UUID id, MarketStatus status) {
        Market market = new Market();
        market.setId(id);
        market.setStatus(status);
        return market;
    }
}
