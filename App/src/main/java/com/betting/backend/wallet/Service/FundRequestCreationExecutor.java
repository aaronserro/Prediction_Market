package com.betting.backend.wallet.Service;

import java.util.Optional;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.betting.backend.wallet.Repository.FundRequestRepository;
import com.betting.backend.wallet.Repository.WalletRepository;
import com.betting.backend.wallet.model.FundRequest;
import com.betting.backend.wallet.model.Wallet;

@Service
public class FundRequestCreationExecutor {
    private final FundRequestRepository fundRequestRepository;
    private final WalletRepository walletRepository;
    private final ApplicationEventPublisher eventPublisher;

    public FundRequestCreationExecutor(
            FundRequestRepository fundRequestRepository,
            WalletRepository walletRepository,
            ApplicationEventPublisher eventPublisher) {
        this.fundRequestRepository = fundRequestRepository;
        this.walletRepository = walletRepository;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public FundRequest create(
            Long userId,
            Long amountCents,
            String reason,
            String idempotencyKey) {
        Optional<FundRequest> existing =
                fundRequestRepository.findByIdempotencyKey(idempotencyKey);
        if (existing.isPresent()) {
            return existing.get();
        }

        Wallet wallet = walletRepository.findByUser_Id(userId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Wallet not found for user id " + userId));
        FundRequest saved = fundRequestRepository.saveAndFlush(
                new FundRequest(wallet, amountCents, reason, idempotencyKey));
        eventPublisher.publishEvent(
                new FundRequestCreatedEvent(userId, amountCents, reason));
        return saved;
    }
}