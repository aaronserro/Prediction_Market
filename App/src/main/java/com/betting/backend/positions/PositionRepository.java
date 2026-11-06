package com.betting.backend.positions;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;
@Repository
public interface PositionRepository extends JpaRepository<Position, Long> {

@Lock(LockModeType.PESSIMISTIC_WRITE)
Optional<Position> findByUser_IdAndOutcomeId(Long userId, UUID outcomeId);

    @Query("SELECT p FROM Position p " +
           "LEFT JOIN FETCH p.outcome o " +
           "LEFT JOIN FETCH o.market " +
           "WHERE p.user.id = :userId")
    List<Position> findAllByUser_IdWithMarket(@Param("userId") Long userId);

    @Query("SELECT p FROM Position p " +
           "LEFT JOIN FETCH p.outcome o " +
           "LEFT JOIN FETCH o.market")
    List<Position> findAllWithMarket();

    List<Position> findAllByUser_Id(Long userId);
    List<Position> findByOutcome_Market_IdAndStatus(UUID marketId, PositionStatus status);

    @Query("SELECT p.id FROM Position p WHERE p.outcome.market.id = :marketId AND p.status = :status")
    List<Long> findIdsByMarketIdAndStatus(@Param("marketId") UUID marketId,
                                          @Param("status") PositionStatus status);

    long countByOutcome_Market_IdAndStatus(UUID marketId, PositionStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Position p WHERE p.id = :id")
    Optional<Position> findByIdForUpdate(@Param("id") Long id);
       List<Position> findByMarketId(UUID marketId);
    boolean existsByUser_IdAndOutcomeId(Long userId, UUID outcomeId);

    List<Position> findByUserIdAndStatus(Long userId, PositionStatus status);


}
