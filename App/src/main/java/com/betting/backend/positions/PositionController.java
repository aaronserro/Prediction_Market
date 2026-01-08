// File: src/main/java/com/betting/backend/positions/PositionController.java
package com.betting.backend.positions;

import java.security.Principal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.betting.backend.positions.PositionResponse;
import com.betting.backend.user.User;
import com.betting.backend.user.UserRepository;

/**
 * Read-only endpoint for the user's portfolio.
 *
 * GET /api/v1/positions/me
 *
 * NOTE: Pricing is TEMPORARY (static numbers) until you build PricingService.
 */
@RestController
@RequestMapping("/api/v1/positions")
public class PositionController {

    private final PositionRepository positionRepository;
    private final UserRepository userRepository;

    public PositionController(PositionRepository positionRepository,
                              UserRepository userRepository) {
        this.positionRepository = positionRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/me")
    public List<PositionResponse> getMyPositions(Principal principal) {
        String username = principal.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found for: " + username));

        List<Position> positions = positionRepository.findAllByUser_Id(user.getId());

        List<PositionResponse> out = new ArrayList<>();
        for (Position p : positions) {

            // If you're deleting closed positions, this is unnecessary.
            // If you keep qty=0 rows, skip them:
            if (p.getQuantity() <= 0) continue;

            UUID outcomeId = p.getOutcome().getId();

            // If your Outcome has a Market relationship, use it. Otherwise you can set marketId=null for now.
            UUID marketId = (p.getOutcome().getMarket() != null) ? p.getOutcome().getMarket().getId() : null;

            // Change this getter if your Outcome doesn't have "name"
            String outcomeName = safeOutcomeName(p);

            int qty = p.getQuantity();
            long costBasis = p.getCostBasisCents();
            long avgBuy = (qty > 0) ? (costBasis / qty) : 0;

            // TEMP static price (replace with PricingService later)
            long currentPrice = getStaticCurrentPriceCents(outcomeId);

            long marketValue = (long) qty * currentPrice;
            long unrealized = marketValue - costBasis;
            long realized = (p.getRealizedPnl() == null) ? 0L : p.getRealizedPnl();

            out.add(new PositionResponse(
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
     * TEMP pricing: static numbers until PricingService exists.
     * You can make this smarter later (per-market, per-outcome, AMM, etc.)
     */
    private long getStaticCurrentPriceCents(UUID outcomeId) {
        // Easiest placeholder: constant price for everything
        return 150L;

        // If you want per-outcome static pricing, you can do something like:
        // return Math.floorMod(outcomeId.hashCode(), 200) + 50; // 50..249 cents
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
