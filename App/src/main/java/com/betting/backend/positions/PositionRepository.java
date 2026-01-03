package com.betting.backend.positions;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
@Repository
public interface PositionRepository extends JpaRepository<Position, Long> {

    Optional<Position> findByUser_IdAndOutcomeId(Long userId, UUID outcomeId);

    List<Position> findAllByUser_Id(Long userId);

    boolean existsByUser_IdAndOutcomeId(Long userId, UUID outcomeId);

    void deleteByUser_IdAndOutcomeId(Long userId, UUID outcomeId);
}
