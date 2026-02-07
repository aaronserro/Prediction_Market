package com.betting.backend.positions;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.betting.backend.markets.Outcome;
import com.betting.backend.markets.OutcomeRepository;
import com.betting.backend.user.User;

/**
 * Implements PositionService using your PositionRepository method names:
 * - findByUser_IdAndOutcomeId(...)
 * - existsByUser_IdAndOutcomeId(...)
 * - deleteByUser_IdAndOutcomeId(...)
 *
 * NOTE: Your interface currently has a typo: applySel(...) not applySell(...).
 * This class implements applySel(...) to match your interface.
 */
@Service
public class PositionServiceImpl implements PositionService {

    private final PositionRepository positionRepository;
    private final OutcomeRepository outcomeRepository;

    public PositionServiceImpl(PositionRepository positionRepository,
                               OutcomeRepository outcomeRepository) {
        this.positionRepository = positionRepository;
        this.outcomeRepository = outcomeRepository;
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
                    return p;
                });

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

        // Average buy price in cents (integer division)
        long avgBuyPriceCents = costBasis / heldQty;

        long proceeds = safeMultiplyToLong(qty, currentMarketprice);
        long costRemoved = (costBasis * (long) qty) /heldQty;
        long realizedDelta = proceeds - costRemoved;

        // Update position state
        position.setQuantity(heldQty - qty);
        position.setCostBasisCents(costBasis - costRemoved);

        long prevRealized = (position.getRealizedPnl() == null) ? 0L : position.getRealizedPnl();
        position.setRealizedPnl(prevRealized + realizedDelta);

        // Close logic
        if (position.getQuantity() == 0) {
            // If you'd rather keep the row, replace this delete with a save(position)
            positionRepository.deleteByUser_IdAndOutcomeId(user.getId(), outcomeId);
        } else {
            positionRepository.save(position);
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
