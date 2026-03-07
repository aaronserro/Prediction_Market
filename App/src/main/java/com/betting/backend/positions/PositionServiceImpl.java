package com.betting.backend.positions;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.betting.backend.markets.Outcome;
import com.betting.backend.markets.OutcomeRepository;
import com.betting.backend.user.User;
import com.betting.backend.wallet.Service.WalletService;

import jakarta.annotation.PostConstruct;

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
    private final WalletService walletService;

    public PositionServiceImpl(PositionRepository positionRepository,
                               OutcomeRepository outcomeRepository,
                            WalletService walletService) {
        this.positionRepository = positionRepository;
        this.outcomeRepository = outcomeRepository;
        this.walletService=walletService;
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

        // Close logic
        if (position.getQuantity() == 0) {

            // If you'd rather keep the row, replace this delete with a save(position)
            positionRepository.deleteByUser_IdAndOutcomeId(user.getId(), outcomeId);

        } else {
            positionRepository.save(position);
        }

    }
@Transactional
public void settlePositions(UUID marketId, UUID winningOutcomeId) {
    final int PAYOUT_PER_WINNING_SHARE_CENTS = 100;

    System.out.println("🎯 Starting settlement for market: " + marketId + ", winner: " + winningOutcomeId);

    var openPositions = positionRepository.findByOutcome_Market_IdAndStatus(
            marketId, PositionStatus.OPEN
    );

    System.out.println("📊 Found " + openPositions.size() + " open positions to settle");

    // List to track payouts to process after positions are settled
    java.util.List<PayoutInfo> payoutsToProcess = new java.util.ArrayList<>();

    for (Position position : openPositions) {
        int qty = position.getQuantity();

        System.out.println("  Processing position " + position.getId() +
                          " - User: " + position.getUser().getId() +
                          ", Outcome: " + position.getOutcome().getId() +
                          ", Qty: " + qty);

        // If somehow an OPEN position has 0 qty, just mark it settled so it disappears.
        if (qty <= 0) {
            position.setStatus(PositionStatus.SETTLED);
            positionRepository.save(position);
            System.out.println(" Marked zero-qty position as SETTLED");
            continue;
        }

        boolean isWinner = position.getOutcome() != null
                && position.getOutcome().getId().equals(winningOutcomeId);

        long payoutCents = isWinner
                ? safeMultiplyToLong(qty, PAYOUT_PER_WINNING_SHARE_CENTS)
                : 0L;

        System.out.println("  Winner: " + isWinner + ", Payout: " + payoutCents + " cents");

        long costBasis = position.getCostBasisCents();
        position.setSettledCostBasisCents(costBasis); // <-- add this
        long prevRealized = position.getRealizedPnl() == null ? 0L : position.getRealizedPnl();
        long realizedDelta = payoutCents - costBasis;

        // Update accounting on the position

        position.setRealizedPnl(prevRealized + realizedDelta);

        // Close the position
        position.setQuantity(0);
        position.setCostBasisCents(0L);
        position.setStatus(PositionStatus.SETTLED);

        positionRepository.save(position);
        System.out.println("  ✅ Position marked as SETTLED");

        // Queue payout for processing after transaction commits
        if (payoutCents > 0) {
            payoutsToProcess.add(new PayoutInfo(
                position.getUser().getId(),
                payoutCents,
                marketId
            ));
        } else {
            System.out.println("  ℹ️ No payout (loser or zero-qty position)");
        }
    }

    System.out.println("✅ Settlement complete for market " + marketId);

    // Process all payouts after positions are settled
    System.out.println("💳 Processing " + payoutsToProcess.size() + " payouts...");
    for (PayoutInfo payout : payoutsToProcess) {
        try {
            String ideKey = "SETTLEv1:" + payout.marketId + ":" + payout.userId;
            String refId  = "MARKET_SETTLEMENT:" + payout.marketId;

            System.out.println("  💸 Attempting to credit " + payout.amountCents + " cents to user " + payout.userId);

            walletService.credit(
                    payout.amountCents,
                    payout.userId,
                    ideKey,
                    refId
            );

            System.out.println("  💰 Successfully credited " + payout.amountCents + " cents to user " + payout.userId);
        } catch (Exception e) {
            System.err.println("  ❌ ERROR crediting wallet for user " + payout.userId + ": " + e.getMessage());
            e.printStackTrace();
        }
    }

    System.out.println("✅ All payouts processed for market " + marketId);
}

    // Helper class to track payout information
    private static class PayoutInfo {
        final Long userId;
        final long amountCents;
        final UUID marketId;

        PayoutInfo(Long userId, long amountCents, UUID marketId) {
            this.userId = userId;
            this.amountCents = amountCents;
            this.marketId = marketId;
        }
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
