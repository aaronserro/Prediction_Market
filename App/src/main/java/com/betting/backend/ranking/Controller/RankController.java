package com.betting.backend.ranking.Controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.betting.backend.ranking.dto.UserRankProfileResponse;
import com.betting.backend.ranking.service.RankQueryService;

@RestController
@RequestMapping("/api/ranks")
@CrossOrigin
public class RankController {

    private final RankQueryService rankQueryService;

    public RankController(RankQueryService rankQueryService) {
        this.rankQueryService = rankQueryService;
    }

    @GetMapping("/{userId}")
    public ResponseEntity<UserRankProfileResponse> getRankProfile(@PathVariable Long userId) {
        return ResponseEntity.ok(rankQueryService.getByUserId(userId));
    }
}