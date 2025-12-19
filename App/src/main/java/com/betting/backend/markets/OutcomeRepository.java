package com.betting.backend.markets;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface OutcomeRepository extends JpaRepository<Outcome, UUID> {

    List<Outcome> findByMarketId(UUID marketId);
}
