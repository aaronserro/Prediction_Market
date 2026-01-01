package com.betting.backend.trades;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.betting.backend.markets.dto.MarketCreateRequest;
import com.betting.backend.markets.dto.MarketResponse;
import com.betting.backend.trades.dto.CreateTradeRequest;
import com.betting.backend.trades.dto.TradeResponse;
import com.betting.backend.user.User;
import com.betting.backend.user.UserRepository;

import org.springframework.security.core.userdetails.UserDetails;
@RestController
@RequestMapping("/api/v1/trades")
public class TradeController {
    private final UserRepository userRepository;
    private final TradeService tradeService;
    public TradeController(TradeService tradeService, UserRepository userRepository){
        this.tradeService=tradeService;

        this.userRepository = userRepository;


    }
    @PostMapping("/buy")
    public ResponseEntity<TradeResponse> createBuyTrade(
        @RequestBody CreateTradeRequest request,
        Principal principal
    ){
        System.out.println("REQ outcome=" + request.getOutcomeId() +
                   " market=" + request.getMarketId() +
                   " qty=" + request.getQuantity());

        String emailOrUsername = principal.getName();
        User user = userRepository.findByUsername(emailOrUsername)
                .orElseThrow(() -> new RuntimeException("User not found for: " + emailOrUsername));

        TradeResponse response = tradeService.createBuyTrade(request, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }




}
