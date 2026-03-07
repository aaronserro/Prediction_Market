package com.betting.backend.ranking.service;

import org.springframework.stereotype.Service;

import com.betting.backend.ranking.model.RankTier;
@Service
public interface RankTierService {
    RankTier mapPointsToTier(int points);

}
