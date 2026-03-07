package com.betting.backend.markets;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface OutcomeRepository extends JpaRepository<Outcome, UUID> {

    List<Outcome> findByMarketId(UUID marketId);

    @Query("SELECT o FROM Outcome o " +
           "WHERE o.market.id = :marketId " +
           "AND o.id = (SELECT m.winningOutcomeId FROM Market m WHERE m.id = :marketId)")
    Outcome findWinningOutcome(@Param("marketId") UUID marketId);
}
