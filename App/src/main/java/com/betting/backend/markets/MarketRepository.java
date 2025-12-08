package com.betting.backend.markets;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MarketRepository extends JpaRepository<Market, UUID> {

    // 1. Find a market by its ID
    // Already provided by JpaRepository: findById(UUID id)

    // 2. Return all markets
    // Already provided by JpaRepository: findAll()

    // 3. Return all markets based on status
    List<Market> findByStatus(MarketStatus status);

    // 4. Return all markets based on category
    List<Market> findByCategory(MarketCategory category);

    // Optional: find markets by status + category
    List<Market> findByStatusAndCategory(MarketStatus status, MarketCategory category);
    <Optional>Market findByTitle(String Title);
}
