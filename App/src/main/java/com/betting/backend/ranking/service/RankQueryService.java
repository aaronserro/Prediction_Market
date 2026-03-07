package com.betting.backend.ranking.service;

import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;

import com.betting.backend.ranking.dto.UserRankProfileResponse;
import com.betting.backend.ranking.model.RankTier;
import com.betting.backend.user.User;
import com.betting.backend.user.UserRankProfile;
import com.betting.backend.user.UserRankProfileRepository;
import com.betting.backend.user.UserRepository;

@Service
public class RankQueryService {

    private final UserRankProfileRepository userRankProfileRepository;
    private final UserRepository userRepository;
    public RankQueryService(UserRankProfileRepository userRankProfileRepository,
                            UserRepository userRepository) {
        this.userRankProfileRepository = userRankProfileRepository;
        this.userRepository = userRepository;
    }


        @Transactional
    public UserRankProfileResponse getByUserId(Long userId) {

        UserRankProfile profile = userRankProfileRepository.findByUser_Id(userId)
                .orElseGet(() -> createDefaultProfile(userId));

        return new UserRankProfileResponse(
                profile.getUser().getId(),
                profile.getTraderPoints(),
                profile.getPredictorPoints(),
                profile.getOverallPoints(),
                profile.getTraderRank(),
                profile.getPredictorRank(),
                profile.getOverallRank(),
                profile.getResolvedMarketsCount()
        );
    }
        private UserRankProfile createDefaultProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found for userId=" + userId));

        UserRankProfile profile = new UserRankProfile();
        profile.setUser(user);

        profile.setTraderPoints(0);
        profile.setPredictorPoints(0);
        profile.setOverallPoints(0);

        profile.setTraderRank(RankTier.BRONZE_3);
        profile.setPredictorRank(RankTier.BRONZE_3);
        profile.setOverallRank(RankTier.BRONZE_3);

        profile.setResolvedMarketsCount(0);

        return userRankProfileRepository.save(profile);
    }

}