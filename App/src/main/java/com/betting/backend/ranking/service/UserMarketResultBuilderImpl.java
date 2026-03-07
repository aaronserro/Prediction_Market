package com.betting.backend.ranking.service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.betting.backend.markets.MarketRepository;
import com.betting.backend.markets.MarketStatus;
import com.betting.backend.markets.OutcomeRepository;
import com.betting.backend.markets.PricingService;
import com.betting.backend.positions.Position;
import com.betting.backend.positions.PositionRepository;
import com.betting.backend.positions.PositionStatus;
import com.betting.backend.ranking.dto.UserMarketResult;
@Service
public class UserMarketResultBuilderImpl implements UserMarketResultBuilder {
    private final PositionRepository positionRepository;
    private final OutcomeRepository outcomeRepository;

    private final PricingService pricingService;

    public UserMarketResultBuilderImpl(PositionRepository positionRepository,
                                       OutcomeRepository outcomeRepository,

                                    PricingService pricingService) {
        this.positionRepository = positionRepository;
        this.outcomeRepository = outcomeRepository;

        this.pricingService =pricingService;
    }


    @Override
    public List<UserMarketResult> buildResults(UUID marketId){
        List<Position> positions = positionRepository.findByOutcome_Market_IdAndStatus(marketId, PositionStatus.SETTLED);
        List<UserMarketResult> results = new ArrayList<>();
        UUID winningOutcomeId = outcomeRepository.findWinningOutcome(marketId).getId();
        double finalProbability = pricingService.getSpotprice(marketId, winningOutcomeId);
        for(Position position: positions){
            boolean won = position.getOutcome().getId().equals(winningOutcomeId);
            long realizedPnl = position.getRealizedPnl();
            //long avg_entry = position.getCostBasisCents()/position.getQuantity();
            long capitalRisked = Math.abs(position.getSettledCostBasisCents());
            int realizedPnlInt = Math.toIntExact(realizedPnl);
            //int avgEntryInt = Math.toIntExact(avg_entry);
            int capitalRiskedInt = Math.toIntExact(capitalRisked);
            if (capitalRisked <= 0)
                continue;
            if (capitalRisked < 500)
                continue;
            UserMarketResult result = new UserMarketResult(
            position.getUser().getId(),
            marketId,
            won,
            realizedPnlInt,
            capitalRiskedInt,
            finalProbability);

            results.add(result);
        }
        return results;

    }


}
