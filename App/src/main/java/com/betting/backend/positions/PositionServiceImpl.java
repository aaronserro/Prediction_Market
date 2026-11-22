package com.betting.backend.positions;

import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.betting.backend.markets.Outcome;
import com.betting.backend.markets.OutcomeRepository;
import com.betting.backend.trades.TradeLimits;
import com.betting.backend.user.User;

import jakarta.annotation.PostConstruct;

/**
 * Implements PositionService using your PositionRepository method names:
 * - findByUser_IdAndOutcomeId(...)
 * - existsByUser_IdAndOutcomeId(...)
 *
 * NOTE: Your interface currently has a typo: applySel(...) not applySell(...).
 * This class implements applySel(...) to match your interface.
 */
@Service
public class PositionServiceImpl implements PositionService {

    private static final Logger log = LoggerFactory.getLogger(PositionServiceImpl.class);

    private final PositionRepository positionRepository;
    private final OutcomeRepository outcomeRepository;
    private final PositionSettlementExecutor settlementExecutor;

    public PositionServiceImpl(PositionRepository positionRepository,
                               OutcomeRepository outcomeRepository,
                               PositionSettlementExecutor settlementExecutor) {
        this.positionRepository = positionRepository;
        this.outcomeRepository = outcomeRepository;
        this.settlementExecutor = settlementExecutor;
    }

    @Override
    @Transactional
    public Position applyBuy(User user, UUID outcomeId, int qty, long totalCostCents) {
        TradeLimits.requireValidQuantity(qty);
        validateNonNegativePrice(totalCostCents);

        Outcome outcome = outcomeRepository.findById(outcomeId)
                .orElseThrow(() -> new IllegalArgumentException("Outcome not found: " + outcomeId));

        Position position = positionRepository.findByUser_IdAndOutcomeId(user.getId(), outcomeId)
                .orElseGet(() -> {
                    Position p = new Position();
                    p.setUser(user);
                    p.setOutcome(outcome);
                    p.setQuantity(0);
                    p.setCostBasisCents(0L);
                    p.setRealizedPnl(0L);
                    // Set market info from outcome
                    if (outcome.getMarket() != null) {
                        p.setMarketId(outcome.getMarket().getId());
                        p.setMarketName(outcome.getMarket().getTitle());
                    }
                    return p;
                });
        position.setStatus(PositionStatus.OPEN);

        int updatedQuantity = Math.addExact(position.getQuantity(), qty);
        long updatedCostBasis = Math.addExact(position.getCostBasisCents(), totalCostCents);
        position.setQuantity(updatedQuantity);
        position.setCostBasisCents(updatedCostBasis);

        return positionRepository.save(position);
    }

    @Override
    @Transactional
    public void applySell(User user, UUID outcomeId, int qty, long totalProceedsCents) {
        TradeLimits.requireValidQuantity(qty);
        validateNonNegativePrice(totalProceedsCents);

        Position position = positionRepository.findByUser_IdAndOutcomeId(user.getId(), outcomeId)
                .orElseThrow(() -> new IllegalStateException(
                        "No open position for user=" + user.getId() + " outcome=" + outcomeId));

        int heldQty = position.getQuantity();
        if (heldQty <= 0) {
            throw new IllegalStateException("Position already closed (qty=0) for outcome=" + outcomeId);
        }
        if (qty > heldQty) {
            throw new IllegalArgumentException(
                    "Cannot sell more than held. Held=" + heldQty + ", requested=" + qty);
        }

        long costBasis = position.getCostBasisCents();

        long proceeds = totalProceedsCents;
        long costRemoved = Math.multiplyExact(costBasis, (long) qty) / heldQty;
        long realizedDelta = Math.subtractExact(proceeds, costRemoved);

        // Update position state
        position.setQuantity(Math.subtractExact(heldQty, qty));
        position.setCostBasisCents(Math.subtractExact(costBasis, costRemoved));

        long prevRealized = (position.getRealizedPnl() == null) ? 0L : position.getRealizedPnl();
        position.setRealizedPnl(Math.addExact(prevRealized, realizedDelta));

        // Retain fully sold positions so their accumulated realized P&L remains
        // available to the portfolio endpoint. A later buy reuses this row.
        positionRepository.save(position);

    }
    /**
     * Settles every OPEN position in the market. Each position (and its payout)
     * commits in its own transaction; failures are logged and left OPEN so a
     * later call can retry them. Intentionally not @Transactional.
     *
     * @return number of positions that failed to settle
     */
    @Override
    public int settlePositions(UUID marketId, UUID winningOutcomeId) {
        int failures = 0;
        for (Long positionId : positionRepository.findIdsByMarketIdAndStatus(marketId, PositionStatus.OPEN)) {
            try {
                settlementExecutor.settle(positionId, marketId, winningOutcomeId);
            } catch (RuntimeException e) {
                failures++;
                log.error("Failed to settle position {} for market {}", positionId, marketId, e);
            }
        }
        return failures;
    }

    /**
     * Migrate existing positions to populate marketId and marketName.
     * This runs once on application startup to fix positions created before these fields were added.
     */
    @PostConstruct
    @Transactional
    public void migrateExistingPositions() {
        try {
            // Use query that eagerly fetches outcomes and markets to avoid lazy loading
            var allPositions = positionRepository.findAllWithMarket();
            int updated = 0;

            for (Position position : allPositions) {
                // Skip if already populated
                if (position.getMarketId() != null && position.getMarketName() != null) {
                    continue;
                }

                // Now we can safely access the market since it was fetched eagerly
                if (position.getOutcome() != null && position.getOutcome().getMarket() != null) {
                    position.setMarketId(position.getOutcome().getMarket().getId());
                    position.setMarketName(position.getOutcome().getMarket().getTitle());
                    positionRepository.save(position);
                    updated++;
                }
            }

            if (updated > 0) {
                log.info("Position migration completed count={}", updated);
            }
        } catch (Exception e) {
            log.error("Position migration failed", e);
        }
    }

    private static void validateNonNegativePrice(long totalCostCents) {
        if (totalCostCents < 0) throw new IllegalArgumentException("totalCostCents must be >= 0");
    }
}
