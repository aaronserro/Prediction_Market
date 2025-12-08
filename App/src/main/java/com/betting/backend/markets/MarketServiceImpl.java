package com.betting.backend.markets;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.betting.backend.markets.dto.MarketCreateRequest;
import com.betting.backend.markets.dto.MarketResponse;
import com.betting.backend.markets.dto.OutcomeResponse;

import org.springframework.transaction.annotation.Transactional;
@Service

public class MarketServiceImpl implements MarketService{
    private final MarketRepository marketRepository;
    private final OutcomeRepository outcomeRepository;
    public MarketServiceImpl(MarketRepository marketRepository, OutcomeRepository outcomeRepository){
        this.marketRepository=marketRepository;
        this.outcomeRepository=outcomeRepository;
    }
    @Override
    @Transactional
    public MarketResponse createMarket(MarketCreateRequest request){
        if (request == null) {
            throw new IllegalArgumentException("Request cannot be null");
        }

        if (request.getResolutionSource() == null || request.getResolutionSource().isBlank()) {
            throw new IllegalArgumentException("Resolution source cannot be null or blank");
        }

        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new IllegalArgumentException("Title cannot be null or blank");
        }

        if (request.getCategory() == null || request.getCategory().isBlank()) {
            throw new IllegalArgumentException("Category cannot be null or blank");
        }

        if (request.getStartDate() == null || request.getEndDate() == null) {
            throw new IllegalArgumentException("Start date and end date cannot be null");
        }

        if (request.getStartDate().isAfter(request.getEndDate())) {
            throw new IllegalArgumentException("Start date must be before end date");
        }

        if (request.getOutcomes() == null || request.getOutcomes().size() < 2) {
            throw new IllegalArgumentException("At least two outcomes are required");
        }
        boolean anyBlankOutcome = request.getOutcomes().stream()
            .anyMatch(o -> o == null || o.isBlank());
        if (anyBlankOutcome) {
            throw new IllegalArgumentException("Outcome labels cannot be null or blank");
        }

        Market market = new Market();
        market.setCreatorId(2L);//hardcoded creator Id

        market.setTitle(request.getTitle());
        market.setDescription(request.getDescription());
        market.setResolutionSource(request.getResolutionSource());
        market.setStartDate(request.getStartDate());
        market.setEndDate(request.getEndDate());
        MarketCategory categoryEnum = MarketCategory.valueOf(request.getCategory().toUpperCase());
        market.setCategory(categoryEnum);

        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(request.getStartDate())) {
            market.setStatus(MarketStatus.UPCOMING);
        } else if (now.isAfter(request.getEndDate())) {
            market.setStatus(MarketStatus.CLOSED);
        } else {
            market.setStatus(MarketStatus.ACTIVE);
        }
        request.getOutcomes().forEach(label -> {
            Outcome outcome = new Outcome();
            outcome.setLabel(label);
            market.addOutcome(outcome);   // sets both sides of relationship
        });
        Market saved = marketRepository.save(market);
        return toResponse(saved);




    }
    private MarketResponse toResponse(Market market) {
        MarketResponse resp = new MarketResponse();
        resp.setId(market.getId());
        resp.setTitle(market.getTitle());
        resp.setDescription(market.getDescription());
        resp.setCategory(market.getCategory());
        resp.setStatus(market.getStatus());
        resp.setStartDate(market.getStartDate());
        resp.setEndDate(market.getEndDate());
        resp.setResolutionSource(market.getResolutionSource());

        List<OutcomeResponse> outcomeLabels = market.getOutcomes().stream()
                .map(this::toOutcomeResponse)
                .toList();

        resp.setOutcomes(outcomeLabels);

        return resp;
    }
    private OutcomeResponse toOutcomeResponse(Outcome outcome){
        OutcomeResponse resp = new OutcomeResponse();
        resp.setId(outcome.getId());
        resp.setLabel(outcome.getLabel());
        return resp;
    }

    @Override
    @Transactional(readOnly = true)
    public MarketResponse getMarketById(UUID marketId){
        if(marketId==null){
            throw new IllegalArgumentException("marketID is null");
        }
        Market market  = marketRepository.findById(marketId)
        .orElseThrow(()-> new IllegalStateException("cannot find market"));
        return toResponse(market);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MarketResponse> getMarketsonStatus(MarketStatus status){
    if (status == null) {
        throw new IllegalArgumentException("MarketStatus cannot be null");
    }

    List<Market> markets = marketRepository.findByStatus(status);

    return markets.stream()
            .map(this::toResponse)
            .toList();
    }

    public List<MarketResponse> getAllMarkets(){
    return marketRepository.findAll()
            .stream()
            .map(this::toResponse)
            .toList();
    }


    @Override
    @Transactional(readOnly = true)
    public  List<MarketResponse> getMarketsByCategory(MarketCategory category){
    if (category == null) {
        throw new IllegalArgumentException("Category cannot be null");
    }

    List<Market> markets = marketRepository.findByCategory(category);

    return markets.stream()
            .map(this::toResponse)
            .toList();
    }


}
