package com.betting.backend.ranking.service;

import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import com.betting.backend.user.UserRankProfileRepository;
import com.betting.backend.ranking.dto.UserMarketResult;
import com.betting.backend.user.UserRankProfile;

@Service
public class RankUpdateServiceImpl implements RankUpdateService {

    private static final Logger log = LoggerFactory.getLogger(RankUpdateServiceImpl.class);

    private final UserMarketResultBuilder userMarketResultBuilder;
    private final TraderScoringService traderScoringService;
    private final PredictorScoringService predictorScoringService;
    private final OverallScoringService overallScoringService;
    private final UserRankProfileRepository userRankProfileRepository;
    private final RankTierService rankTierService;
    public RankUpdateServiceImpl(
            RankTierService rankTierService,
            UserMarketResultBuilder userMarketResultBuilder,
            TraderScoringService traderScoringService,
            PredictorScoringService predictorScoringService,
            OverallScoringService overallScoringService,
            UserRankProfileRepository userRankProfileRepository
    ) {
        this.userMarketResultBuilder = userMarketResultBuilder;
        this.traderScoringService = traderScoringService;
        this.predictorScoringService = predictorScoringService;
        this.overallScoringService = overallScoringService;
        this.userRankProfileRepository = userRankProfileRepository;
        this.rankTierService=rankTierService;
    }

    @Override
    public void processMarketResolution(UUID marketId) {

        List<UserMarketResult> results = userMarketResultBuilder.buildResults(marketId);

        for (UserMarketResult result : results) {

            int traderPoints = traderScoringService.calculateTraderPoints(result);
            int predictorPoints = predictorScoringService.calculatePredictorPoints(result);
            int overallPoints = overallScoringService.calculateOverallPoints(traderPoints, predictorPoints);

            // V1: log it (replace this block with persistence later)
            UserRankProfile profile = userRankProfileRepository.findByUser_Id(result.getUserId())
                    .orElseThrow(() -> new IllegalStateException(
                            "No UserRankProfile found for userId=" + result.getUserId()
                    ));

            profile.setTraderPoints(profile.getTraderPoints() + traderPoints);
            profile.setPredictorPoints(profile.getPredictorPoints() + predictorPoints);
            profile.setOverallPoints(profile.getOverallPoints() + overallPoints);

            profile.setResolvedMarketsCount(profile.getResolvedMarketsCount() + 1);

            profile.setTraderRank(
                    rankTierService.mapPointsToTier(profile.getTraderPoints())
            );
            profile.setPredictorRank(
                    rankTierService.mapPointsToTier(profile.getPredictorPoints())
            );
            profile.setOverallRank(
                    rankTierService.mapPointsToTier(profile.getOverallPoints())
            );

            userRankProfileRepository.save(profile);
            log.info(
                "RANK_UPDATE marketId={} userId={} traderPoints={} predictorPoints={} overallPoints={} pnl={} risk={} finalProb={}",
                marketId,
                result.getUserId(),
                traderPoints,
                predictorPoints,
                overallPoints,
                result.getRealizedPnl(),
                result.getCapitalRisked(),
                result.getFinalMarketProbability()
            );
        }
    }
}