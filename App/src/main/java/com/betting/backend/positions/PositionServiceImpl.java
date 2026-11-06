package com.betting.backend.positions;

import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.betting.backend.markets.Outcome;
import com.betting.backend.markets.OutcomeRepository;
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
    public Position applyBuy(User user, UUID outcomeId, int qty, int buypriceCents) {
        validatePositiveQty(qty);
        validateNonNegativePrice(buypriceCents);

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

        long addCost = safeMultiplyToLong(qty, buypriceCents);

        position.setQuantity(position.getQuantity() + qty);
        position.setCostBasisCents(position.getCostBasisCents() + addCost);

        return positionRepository.save(position);
    }

    @Override
    @Transactional
    public void applySel(User user, UUID outcomeId, int qty, int currentMarketprice) {
        validatePositiveQty(qty);
        validateNonNegativePrice(currentMarketprice);

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

        long proceeds = safeMultiplyToLong(qty, currentMarketprice);
        long costRemoved = (costBasis * (long) qty) /heldQty;
        long realizedDelta = proceeds - costRemoved;

        // Update position state
        position.setQuantity(heldQty - qty);
        position.setCostBasisCents(costBasis - costRemoved);

        long prevRealized = (position.getRealizedPnl() == null) ? 0L : position.getRealizedPnl();
        position.setRealizedPnl(prevRealized + realizedDelta);

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
                System.out.println("✅ Migrated " + updated + " positions with marketId/marketName");
            }
        } catch (Exception e) {
            System.err.println("⚠️ Error migrating positions: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private static void validatePositiveQty(int qty) {
        if (qty <= 0) throw new IllegalArgumentException("qty must be > 0");
    }

    private static void validateNonNegativePrice(int priceCents) {
        if (priceCents < 0) throw new IllegalArgumentException("priceCents must be >= 0");
    }

    private static long safeMultiplyToLong(int a, int b) {
        return (long) a * (long) b;
    }

}
