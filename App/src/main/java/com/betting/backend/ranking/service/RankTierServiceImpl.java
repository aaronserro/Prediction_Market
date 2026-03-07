package com.betting.backend.ranking.service;

import org.springframework.stereotype.Service;

import com.betting.backend.ranking.model.RankTier;
@Service
public class RankTierServiceImpl implements RankTierService {
    public RankTierServiceImpl(){}
    @Override
    public RankTier mapPointsToTier(int points) {
        if (points < 0) {
            points = 0;
        }
        if (points >= 1600) return RankTier.GOLD_1;
        if (points >= 1400) return RankTier.GOLD_2;
        if (points >= 1200) return RankTier.GOLD_3;

        if (points >= 1000) return RankTier.SILVER_1;
        if (points >= 800)  return RankTier.SILVER_2;
        if (points >= 600)  return RankTier.SILVER_3;

        if (points >= 400)  return RankTier.BRONZE_1;
        if (points >= 200)  return RankTier.BRONZE_2;

        return RankTier.BRONZE_3;
    }

}
