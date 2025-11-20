package com.betting.backend.wallet.Service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

//import org.springframework.boot.autoconfigure.data.web.SpringDataWebProperties.Sort;
import org.springframework.data.domain.Sort;

import com.betting.backend.wallet.dto.FundRequestCreateRequest;
import com.betting.backend.wallet.dto.FundRequestResponse;
import com.betting.backend.wallet.model.FundRequest;
import com.betting.backend.wallet.model.FundRequestStatus;
import com.betting.backend.wallet.model.Wallet;
import com.betting.backend.wallet.Repository.FundRequestRepository;
import com.betting.backend.wallet.Repository.WalletRepository;
public class FundRequestServiceImpl implements FundRequestService{
    private final FundRequestRepository fundRequestRepository;
    private final WalletRepository walletRepository;
    private final EmailService emailService;
    public FundRequestServiceImpl(FundRequestRepository fundRequestRepository,
                                  WalletRepository walletRepository,
                                  EmailService emailService) {
        this.fundRequestRepository = fundRequestRepository;
        this.walletRepository = walletRepository;
        this.emailService = emailService;
    }
    @Override
    public FundRequestResponse createFundRequest(
        Long userId, FundRequestCreateRequest request){
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
        Wallet wallet = walletRepository.findByUser_Id(userId)
            .orElseThrow(() -> new IllegalArgumentException("Wallet not found for user id " + userId));
        FundRequest entity = new FundRequest(wallet,request.getAmountCents(),request.getReason());
        FundRequest saved = fundRequestRepository.save(entity);
            emailService.sendFundRequestEmail(
            "userId=" + userId,
            request.getAmountCents(),
            request.getReason()
    );

    return toResponse(saved);




    }
    private FundRequestResponse toResponse(FundRequest entity) {
        FundRequestResponse dto = new FundRequestResponse();
        dto.setId(entity.getId());
        dto.setWalletID(entity.getWallet().getId());
        dto.setAmountCents(entity.getAmountCents());          // adjust if your field name differs
        dto.setReason(entity.getReason());
        dto.setStatus(entity.getStatus());
        LocalDateTime createdAt = LocalDateTime.ofInstant(entity.getCreatedAt(), ZoneId.systemDefault());
        LocalDateTime processedAt = entity.getProcessedAt() == null
    ? null
    : LocalDateTime.ofInstant(entity.getProcessedAt(), ZoneId.systemDefault());

        dto.setCreatedAt(createdAt);

        // processedAt can be null
        dto.setProcessedAt(processedAt);

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
    public FundRequestResponse approveRequest(Long requestId, Long adminUserId){}
    @Override
    public FundRequestResponse denyRequest(Long requestId, Long adminUserId){}





}
