package com.betting.backend.ranking.Repo;


import com.betting.backend.ranking.model.UserScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserScoreRepository extends JpaRepository<UserScore, String> {

    /**
     * Finds a user's scores by their unique user ID.
     * Used by Predictor and Trader services before applying point updates.
     */
    Optional<UserScore> findByUserId(String userId);

    /**
     * Custom query to fetch the top players based on your weighted formula
     * (60% Predictor Points + 40% Trader Points).
     *
     * This acts as your temporary, database-driven global leaderboard
     * until we drop the Redis optimization line in.
     */
    @Query("SELECT u FROM UserScore u ORDER BY ((u.predictorPoints * 0.6) + (u.traderPoints * 0.4)) DESC")
    List<UserScore> findTopGlobalLeaderboard();
}