package com.betting.backend.markets;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MarketRepository extends JpaRepository<Market, UUID> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT m FROM Market m WHERE m.id = :id")
    Optional<Market> findByIdForUpdate(@Param("id") UUID id);

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

    // Find markets by status where end date is before the specified date
    List<Market> findByStatusAndEndDateBefore(
        MarketStatus status,
        LocalDateTime now
    );
}
