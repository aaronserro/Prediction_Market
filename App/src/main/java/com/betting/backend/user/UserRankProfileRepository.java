package com.betting.backend.user;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRankProfileRepository
        extends JpaRepository<UserRankProfile, Long> {

    Optional<UserRankProfile> findByUser_Id(Long userId);
    List<UserRankProfile> findTop10ByOrderByOverallPointsDesc();

    List<UserRankProfile> findTop10ByOrderByTraderPointsDesc();

    List<UserRankProfile> findTop10ByOrderByPredictorPointsDesc();

}