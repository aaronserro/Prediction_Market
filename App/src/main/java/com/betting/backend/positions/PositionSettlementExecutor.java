package com.betting.backend.positions;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.betting.backend.wallet.Service.WalletService;

/**
 * Settles one position in its own transaction so a failed payout rolls back
 * only that position (which stays OPEN for a later retry).
 */
@Service
public class PositionSettlementExecutor {
    static final int PAYOUT_PER_WINNING_SHARE_CENTS = 100;

    private final PositionRepository positionRepository;
    private final WalletService walletService;

    public PositionSettlementExecutor(PositionRepository positionRepository,
                                      WalletService walletService) {
        this.positionRepository = positionRepository;
        this.walletService = walletService;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void settle(Long positionId, UUID marketId, UUID winningOutcomeId) {
        Position position = positionRepository.findByIdForUpdate(positionId)
                .orElseThrow(() -> new IllegalStateException("Position not found: " + positionId));

        // Another resolver already settled it.
        if (position.getStatus() != PositionStatus.OPEN) {
            return;
        }

        int qty = position.getQuantity();
        if (qty > 0) {
            boolean isWinner = position.getOutcome() != null
                    && position.getOutcome().getId().equals(winningOutcomeId);
            long payoutCents = isWinner ? (long) qty * PAYOUT_PER_WINNING_SHARE_CENTS : 0L;

            if (payoutCents > 0) {
                walletService.credit(
                        payoutCents,
                        position.getUser().getId(),
                        "SETTLE:v1:" + marketId + ":" + positionId,
                        "MARKET_SETTLEMENT:" + marketId);
            }

            long costBasis = position.getCostBasisCents();
            long prevRealized = position.getRealizedPnl() == null ? 0L : position.getRealizedPnl();
            position.setSettledCostBasisCents(costBasis);
            position.setRealizedPnl(prevRealized + payoutCents - costBasis);
            position.setQuantity(0);
            position.setCostBasisCents(0L);
        }

        position.setStatus(PositionStatus.SETTLED);
        positionRepository.save(position);
    }
}
