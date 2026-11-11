package com.betting.backend.wallet.Service;

import java.time.Instant;
import java.util.List;

//import org.springframework.boot.autoconfigure.data.web.SpringDataWebProperties.Sort;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.betting.backend.wallet.dto.FundRequestCreateRequest;
import com.betting.backend.wallet.dto.FundRequestResponse;
import com.betting.backend.wallet.model.FundRequest;
import com.betting.backend.wallet.model.FundRequestStatus;
import com.betting.backend.wallet.model.Wallet;
import com.betting.backend.wallet.Exceptions.DuplicateOperationException;
import com.betting.backend.wallet.Repository.FundRequestRepository;
import com.betting.backend.wallet.Repository.WalletRepository;
@Service
public class FundRequestServiceImpl implements FundRequestService{
    private final FundRequestRepository fundRequestRepository;
    private final WalletRepository walletRepository;
    private final FundRequestCreationExecutor creationExecutor;
    private final WalletService walletService;
    public FundRequestServiceImpl(FundRequestRepository fundRequestRepository,
                                  WalletRepository walletRepository,
                                  FundRequestCreationExecutor creationExecutor,
                                  WalletService walletService) {
        this.fundRequestRepository = fundRequestRepository;
        this.walletRepository = walletRepository;
        this.creationExecutor = creationExecutor;
        this.walletService=walletService;
    }

    @Override
    public FundRequestResponse createFundRequest(
        Long userId, FundRequestCreateRequest request, String idempotencyKey){
                    // 1) Validate input
        if (userId == null) {
            throw new IllegalArgumentException("userId is required");
        }

        if (request == null) {
            throw new IllegalArgumentException("Request body is required");
        }

        if (request.getAmountCents() == null || request.getAmountCents() <= 0) {
            throw new IllegalArgumentException("Amount must be a positive number.");
        }

        if (request.getReason() == null || request.getReason().isBlank()) {
            throw new IllegalArgumentException("Reason must not be blank.");
        }
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            throw new IllegalArgumentException("Idempotency-Key is required");
        }

        String key = idempotencyKey.trim();
        if (key.length() > 128) {
            throw new IllegalArgumentException("Idempotency-Key must not exceed 128 characters");
        }
        FundRequest existing = fundRequestRepository.findByIdempotencyKey(key).orElse(null);
        if (existing != null) {
            return toResponse(requireMatchingCreation(existing, userId, request, key));
        }

        try {
            FundRequest created = creationExecutor.create(
                    userId, request.getAmountCents(), request.getReason(), key);
            return toResponse(requireMatchingCreation(created, userId, request, key));
        } catch (DataIntegrityViolationException conflict) {
            FundRequest winner = fundRequestRepository.findByIdempotencyKey(key)
                    .orElseThrow(() -> new DuplicateOperationException(
                            key,
                            "FUND_REQUEST_CREATE",
                            "Concurrent fund-request creation prevented this operation"));
            return toResponse(requireMatchingCreation(winner, userId, request, key));
        }
    }

    private static FundRequest requireMatchingCreation(
            FundRequest existing,
            Long userId,
            FundRequestCreateRequest request,
            String idempotencyKey) {
        boolean matches = existing.getWallet().getUser().getId().equals(userId)
                && existing.getAmountCents().equals(request.getAmountCents())
                && existing.getReason().equals(request.getReason());
        if (matches) {
            return existing;
        }
        throw new DuplicateOperationException(
                idempotencyKey,
                "FUND_REQUEST_CREATE",
                "Idempotency key already used for a different fund request");
    }
    private FundRequestResponse toResponse(FundRequest entity) {
        FundRequestResponse dto = new FundRequestResponse();
        dto.setId(entity.getId());
        dto.setWalletID(entity.getWallet().getId());
        if (entity.getWallet().getUser() != null) {
            dto.setUserId(entity.getWallet().getUser().getId());
            dto.setUsername(entity.getWallet().getUser().getUsername());
        }
        dto.setAmountCents(entity.getAmountCents());          // adjust if your field name differs
        dto.setReason(entity.getReason());
        dto.setStatus(entity.getStatus());
        // Instants serialize as UTC ISO-8601 (with "Z"), so clients render the correct local time.
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setProcessedAt(entity.getProcessedAt());

        return dto;
}
    @Override
    public List<FundRequestResponse> listFundRequests(Long userId){
        if(userId==null){
            throw new IllegalArgumentException("User id cannot be null");

        }
        List<FundRequest> entities =
            fundRequestRepository.findByWallet_User_IdOrderByCreatedAtDesc(userId);

        return entities.stream()
                    .map(this::toResponse)
                    .toList();
}






    @Override
    public List<FundRequestResponse> adminList(FundRequestStatus status){
        List<FundRequest> entities;

        if (status == null) {
            entities = fundRequestRepository.findAll(
                Sort.by(Sort.Direction.DESC, "createdAt")
            );
        } else {
            entities = fundRequestRepository.findByStatusOrderByCreatedAtDesc(status);
        }

        return entities.stream()
                    .map(this::toResponse)
                    .toList();
    }
    @Override
    @Transactional
    public FundRequestResponse approveRequest(Long requestId, Long adminUserId){
        if (adminUserId==null){
            throw new IllegalArgumentException("adminUserId cannot be null");

        }
        FundRequest request = fundRequestRepository.findByIdForUpdate(requestId)
        .orElseThrow(() -> new IllegalArgumentException(
            "Fund request not found for id " + requestId
        ));
        if (request.getStatus() == FundRequestStatus.APPROVED) {
            return toResponse(request);
        }
        if (request.getStatus() != FundRequestStatus.PENDING) {
            throw new IllegalStateException("Only PENDING requests can be approved.");
        }

        // Get wallet ID and verify it still exists
        Long walletId = request.getWallet().getId();
        Wallet wallet = walletRepository.findById(walletId)
            .orElseThrow(() -> new IllegalStateException(
                "Cannot approve: wallet " + walletId + " no longer exists"
            ));

        Long userId = wallet.getUser().getId();
        Long amountCents = request.getAmountCents();

        String refId = "FUND_REQUEST:" + requestId;
        walletService.credit(amountCents, userId, refId, refId);

        request.setStatus(FundRequestStatus.APPROVED);
        request.setProcessedAt(Instant.now());
        FundRequest saved = fundRequestRepository.save(request);
        return toResponse(saved);



    }
    @Override
    @Transactional
    public FundRequestResponse denyRequest(Long requestId, Long adminUserId){
        if (adminUserId==null){
            throw new IllegalArgumentException("adminUserId cannot be null");

        }
        FundRequest request = fundRequestRepository.findByIdForUpdate(requestId)
        .orElseThrow(() -> new IllegalArgumentException(
            "Fund request not found for id " + requestId
        ));
        if (request.getStatus() == FundRequestStatus.REJECTED) {
            return toResponse(request);
        }
        if (request.getStatus() != FundRequestStatus.PENDING) {
            throw new IllegalStateException("Only PENDING requests can be rejected.");
        }
        request.setStatus(FundRequestStatus.REJECTED);
        request.setProcessedAt(Instant.now());
        FundRequest saved = fundRequestRepository.save(request);
        return toResponse(saved);
    }





}
