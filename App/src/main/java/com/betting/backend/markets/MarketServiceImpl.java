package com.betting.backend.markets;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.betting.backend.markets.dto.MarketCreateRequest;
import com.betting.backend.markets.dto.MarketResponse;
import com.betting.backend.markets.dto.OutcomeResponse;
import com.betting.backend.markets.dto.UpdateMarketRequest;

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

        // Check and update status if needed
        updateMarketStatus(market);

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

    /**
     * Scheduled task that runs every hour to update market statuses.
     * - UPCOMING markets that have reached their start date become ACTIVE
     * - ACTIVE markets that have passed their end date become CLOSED
     */
    @Scheduled(fixedRate = 3600000) // Run every hour (3600000 ms)
    @Transactional
    public void updateExpiredMarkets() {
        LocalDateTime now = LocalDateTime.now();

        // Find all UPCOMING markets that should now be ACTIVE
        List<Market> upcomingMarkets = marketRepository.findByStatus(MarketStatus.UPCOMING);
        for (Market market : upcomingMarkets) {
            if (!now.isBefore(market.getStartDate())) {
                market.setStatus(MarketStatus.ACTIVE);
                marketRepository.save(market);
            }
        }

        // Find all ACTIVE markets that should now be CLOSED
        List<Market> activeMarkets = marketRepository.findByStatus(MarketStatus.ACTIVE);
        for (Market market : activeMarkets) {
            if (now.isAfter(market.getEndDate())) {
                market.setStatus(MarketStatus.CLOSED);
                marketRepository.save(market);
            }
        }
    }

    /**
     * Helper method to check and update a single market's status based on current time.
     * This ensures real-time accuracy when fetching individual markets.
     */
    private void updateMarketStatus(Market market) {
        LocalDateTime now = LocalDateTime.now();
        MarketStatus currentStatus = market.getStatus();
        MarketStatus newStatus = null;

        // UPCOMING -> ACTIVE when start date is reached
        if (currentStatus == MarketStatus.UPCOMING && !now.isBefore(market.getStartDate())) {
            newStatus = MarketStatus.ACTIVE;
        }

        // ACTIVE -> CLOSED when end date has passed
        if (currentStatus == MarketStatus.ACTIVE && now.isAfter(market.getEndDate())) {
            newStatus = MarketStatus.CLOSED;
        }

        // Save if status changed
        if (newStatus != null && newStatus != currentStatus) {
            market.setStatus(newStatus);
            marketRepository.save(market);
        }
    }
    @Override
    @Transactional
    public MarketResponse updateMarket(UUID marketId, UpdateMarketRequest request) {

        Market market = marketRepository.findById(marketId)
                .orElseThrow(() -> new IllegalArgumentException("Market not found with id: " + marketId));

        // Only update fields that are not null (partial update / PATCH-style)
        if (request.getTitle() != null) {
            market.setTitle(request.getTitle());
        }

        if (request.getDescription() != null) {
            market.setDescription(request.getDescription());
        }

        if (request.getCategory() != null) {
            market.setCategory(request.getCategory());
        }

        if (request.getStatus() != null) {
            market.setStatus(request.getStatus());
        }

        if (request.getEndDate() != null) {
            market.setEndDate(request.getEndDate());
        }

        if (request.getResolutionSource() != null) {
            market.setResolutionSource(request.getResolutionSource());
        }

        Market saved = marketRepository.save(market);

        return toResponse(saved);
    }
}
