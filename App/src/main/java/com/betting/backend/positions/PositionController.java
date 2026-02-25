// File: src/main/java/com/betting/backend/positions/PositionController.java
package com.betting.backend.positions;

import java.security.Principal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.transaction.annotation.Transactional;

import com.betting.backend.positions.PositionResponse;
import com.betting.backend.user.User;
import com.betting.backend.user.UserRepository;
import com.betting.backend.markets.PricingService;
import com.betting.backend.markets.Market;
import com.betting.backend.markets.MarketRepository;
import com.betting.backend.markets.MarketStatus;

/**
 * Read-only endpoint for the user's portfolio.
 *
 * GET /api/v1/positions/me
 */
@RestController
@RequestMapping("/api/v1/positions")
public class PositionController {

    private final PositionRepository positionRepository;
    private final UserRepository userRepository;
    private final PricingService pricingService;
    private final MarketRepository marketRepository;

    public PositionController(PositionRepository positionRepository,
                              UserRepository userRepository,
                              PricingService pricingService,
                              MarketRepository marketRepository) {
        this.positionRepository = positionRepository;
        this.userRepository = userRepository;
        this.pricingService = pricingService;
        this.marketRepository = marketRepository;
    }

    @GetMapping("/me")
    @Transactional(readOnly = true)
    public List<PositionResponse> getMyPositions(Principal principal) {
        String username = principal.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found for: " + username));

        List<Position> positions = positionRepository.findAllByUser_IdWithMarket(user.getId());

        List<PositionResponse> out = new ArrayList<>();
        for (Position p : positions) {

            // If you're deleting closed positions, this is unnecessary.
            // If you keep qty=0 rows, skip them:
            if (p.getQuantity() <= 0) continue;
            if (p.getStatus() == PositionStatus.SETTLED) continue;
            var m = p.getOutcome().getMarket();
            if (m != null && m.getStatus() != com.betting.backend.markets.MarketStatus.ACTIVE) continue;

            UUID outcomeId = p.getOutcome().getId();

            // Use marketId and marketName from Position entity, with fallback to outcome's market
            UUID marketId = p.getMarketId();
            String marketTitle = p.getMarketName();

            // Fallback for existing positions that don't have marketId/marketName populated
            if (marketId == null && p.getOutcome().getMarket() != null) {
                marketId = p.getOutcome().getMarket().getId();
            }
            if (marketTitle == null && p.getOutcome().getMarket() != null) {
                marketTitle = p.getOutcome().getMarket().getTitle();
            }

            // Skip positions with no market info
            if (marketId == null) {
                System.err.println("Position " + p.getId() + " has no marketId, skipping");
                continue;
            }

            String outcomeName = safeOutcomeName(p);

            int qty = p.getQuantity();
            long costBasis = p.getCostBasisCents();
            long avgBuy = (qty > 0) ? (costBasis / qty) : 0;

            // Get actual current price from PricingService
            long currentPrice = getCurrentPriceCents(marketId, outcomeId);

            long marketValue = (long) qty * currentPrice;
            long unrealized = marketValue - costBasis;
            long realized = (p.getRealizedPnl() == null) ? 0L : p.getRealizedPnl();

            out.add(new PositionResponse(
                    marketTitle,
                    marketId,
                    outcomeId,
                    outcomeName,
                    qty,
                    costBasis,
                    avgBuy,
                    currentPrice,
                    marketValue,
                    unrealized,
                    realized
            ));
        }

        return out;
    }

    /**
     * Get the current price for an outcome based on market status.
     * Returns price in cents (0-100).
     * - RESOLVED: 100 if winning outcome, 0 otherwise
     * - ACTIVE: LMSR spot price
     * - CLOSED: frozen at last active price (returns spot price)
     */
    private long getCurrentPriceCents(UUID marketId, UUID outcomeId) {
        try {
            if (marketId == null || outcomeId == null) {
                return 50L; // default fallback if market info is missing
            }

            // Get market to check status
            Market market = marketRepository.findById(marketId).orElse(null);
            if (market == null) {
                return 50L;
            }

            // If market is RESOLVED, return 100 for winner, 0 for losers
            if (market.getStatus() == MarketStatus.RESOLVED) {
                UUID winningOutcomeId = market.getWinningOutcomeId();
                if (winningOutcomeId != null && winningOutcomeId.equals(outcomeId)) {
                    return 100L; // Winner gets $1.00 per share
                } else {
                    return 0L; // Losers get $0.00 per share
                }
            }

            // If market is ACTIVE or CLOSED, use LMSR pricing
            // (CLOSED markets show last known price before closing)
            return pricingService.getSpotprice(marketId, outcomeId);

        } catch (Exception e) {
            // Fallback to 50 cents if pricing fails
            System.err.println("Error getting price for market=" + marketId + ", outcome=" + outcomeId + ": " + e.getMessage());
            return 50L;
        }
    }

    private String safeOutcomeName(Position p) {
        try {
            // Most common
            return p.getOutcome().getLabel();
        } catch (Exception ignored) {
            // If Outcome doesn't have getName(), at least return the id
            return p.getOutcome().getId().toString();
        }
    }
}
