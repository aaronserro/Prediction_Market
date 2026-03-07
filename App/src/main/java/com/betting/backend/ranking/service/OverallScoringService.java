package com.betting.backend.ranking.service;

public interface OverallScoringService {
    int calculateOverallPoints(int traderpoints, int predictorpoints);

}
