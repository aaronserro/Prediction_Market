package com.betting.backend.positions;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.lang.reflect.Method;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.betting.backend.markets.Outcome;
import com.betting.backend.markets.OutcomeRepository;
import com.betting.backend.user.User;
import com.betting.backend.wallet.Service.WalletService;

class PositionSettlementTest {

    private final UUID marketId = UUID.randomUUID();
    private final UUID winningOutcomeId = UUID.randomUUID();

    @Test
    void winnerIsCreditedWithDeterministicKeyAndMarkedSettled() {
        PositionRepository repo = mock(PositionRepository.class);
        WalletService wallet = mock(WalletService.class);
        Position position = position(7L, 5L, winningOutcomeId, 10, 400L, 50L);
        when(repo.findByIdForUpdate(7L)).thenReturn(Optional.of(position));

        new PositionSettlementExecutor(repo, wallet).settle(7L, marketId, winningOutcomeId);

        verify(wallet).credit(1_000L, 5L,
                "SETTLE:v1:" + marketId + ":7", "MARKET_SETTLEMENT:" + marketId);
        assertThat(position.getStatus()).isEqualTo(PositionStatus.SETTLED);
        assertThat(position.getQuantity()).isZero();
        assertThat(position.getRealizedPnl()).isEqualTo(50L + 1_000L - 400L);
    }

    @Test
    void loserIsSettledWithoutCredit() {
        PositionRepository repo = mock(PositionRepository.class);
        WalletService wallet = mock(WalletService.class);
        Position position = position(8L, 5L, UUID.randomUUID(), 10, 400L, 0L);
        when(repo.findByIdForUpdate(8L)).thenReturn(Optional.of(position));

        new PositionSettlementExecutor(repo, wallet).settle(8L, marketId, winningOutcomeId);

        verify(wallet, never()).credit(any(), any(), any(), any());
        assertThat(position.getStatus()).isEqualTo(PositionStatus.SETTLED);
        assertThat(position.getRealizedPnl()).isEqualTo(-400L);
    }

    @Test
    void alreadySettledPositionIsNotPaidAgain() {
        PositionRepository repo = mock(PositionRepository.class);
        WalletService wallet = mock(WalletService.class);
        Position position = position(9L, 5L, winningOutcomeId, 10, 400L, 0L);
        position.setStatus(PositionStatus.SETTLED);
        when(repo.findByIdForUpdate(9L)).thenReturn(Optional.of(position));

        new PositionSettlementExecutor(repo, wallet).settle(9L, marketId, winningOutcomeId);

        verify(wallet, never()).credit(any(), any(), any(), any());
    }

    @Test
    void fullySoldPositionKeepsRealizedPnlOnSettlement() {
        PositionRepository repo = mock(PositionRepository.class);
        WalletService wallet = mock(WalletService.class);
        Position position = position(10L, 5L, winningOutcomeId, 0, 0L, 120L);
        when(repo.findByIdForUpdate(10L)).thenReturn(Optional.of(position));

        new PositionSettlementExecutor(repo, wallet).settle(10L, marketId, winningOutcomeId);

        verify(wallet, never()).credit(any(), any(), any(), any());
        assertThat(position.getStatus()).isEqualTo(PositionStatus.SETTLED);
        assertThat(position.getRealizedPnl()).isEqualTo(120L);
    }

    @Test
    void oneFailedPayoutDoesNotStopOtherPositions() {
        PositionRepository repo = mock(PositionRepository.class);
        PositionSettlementExecutor executor = mock(PositionSettlementExecutor.class);
        when(repo.findIdsByMarketIdAndStatus(marketId, PositionStatus.OPEN))
                .thenReturn(List.of(1L, 2L, 3L));
        doThrow(new RuntimeException("wallet down"))
                .when(executor).settle(eq(2L), any(), any());

        int failures = new PositionServiceImpl(repo, mock(OutcomeRepository.class), executor)
                .settlePositions(marketId, winningOutcomeId);

        assertThat(failures).isEqualTo(1);
        verify(executor).settle(1L, marketId, winningOutcomeId);
        verify(executor).settle(3L, marketId, winningOutcomeId);
    }

    @Test
    void settlementUnitRunsInItsOwnTransaction() throws Exception {
        Method method = PositionSettlementExecutor.class
                .getMethod("settle", Long.class, UUID.class, UUID.class);
        assertThat(method.getAnnotation(Transactional.class).propagation())
                .isEqualTo(Propagation.REQUIRES_NEW);
    }

    @Test
    void sellingLastShareRetainsRowAndRealizedPnl() {
        PositionRepository repo = mock(PositionRepository.class);
        UUID outcomeId = UUID.randomUUID();
        Position position = position(11L, 5L, outcomeId, 10, 400L, 0L);
        when(repo.findByUser_IdAndOutcomeId(anyLong(), eq(outcomeId))).thenReturn(Optional.of(position));

        new PositionServiceImpl(repo, mock(OutcomeRepository.class), mock(PositionSettlementExecutor.class))
                .applySell(position.getUser(), outcomeId, 10, 600L);

        verify(repo).save(position);
        assertThat(position.getQuantity()).isZero();
        assertThat(position.getRealizedPnl()).isEqualTo(600L - 400L);
    }

    private static Position position(Long id, Long userId, UUID outcomeId,
                                     int qty, long costBasis, long realized) {
        User user = new User();
        user.setId(userId);
        Outcome outcome = new Outcome();
        outcome.setId(outcomeId);
        Position position = new Position();
        position.setId(id);
        position.setUser(user);
        position.setOutcome(outcome);
        position.setQuantity(qty);
        position.setCostBasisCents(costBasis);
        position.setRealizedPnl(realized);
        position.setStatus(PositionStatus.OPEN);
        return position;
    }
}
