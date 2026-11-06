package com.betting.backend.wallet.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import com.betting.backend.wallet.model.Wallet;
import com.betting.backend.wallet.model.WalletTransaction;

import org.springframework.data.domain.Pageable;
import com.betting.backend.wallet.Repository.*;
import com.betting.backend.wallet.dto.TransactionResponse;
@Service
public class WalletTransactionServiceImpl implements WalletTransactionService {
    private final WalletTransactionRepository transactionRepository;
    private final WalletRepository walletRepository;

    public WalletTransactionServiceImpl(
            WalletTransactionRepository transactionRepository,
            WalletRepository walletRepository) {
        this.transactionRepository = transactionRepository;
        this.walletRepository = walletRepository;
    }

    public TransactionResponse appendTransaction(Wallet wallet, long deltaCents, long balanceAfterCents, String idempotencyKey,String refId){
    // 1) validate inputs
    if (wallet == null) {
        throw new IllegalArgumentException("Wallet cannot be null");
    }
    if (deltaCents == 0) {
        throw new IllegalArgumentException("deltaCents cannot be 0");
    }
    if (idempotencyKey == null || idempotencyKey.trim().isEmpty()) {
        throw new IllegalArgumentException("idempotencyKey cannot be null or blank");
    }

    final String key = idempotencyKey.trim();

    // 2) Build the immutable transaction. Idempotency coordination happens before
    // this low-level append so a race cannot mutate a wallet without a ledger row.
    WalletTransaction tx = new WalletTransaction();
    tx.setWallet(wallet);
    tx.setDeltaCents(deltaCents);
    tx.setBalanceAfterCents(balanceAfterCents);
    tx.setIdempotencyKey(key);
    tx.setRefId(refId);

    // 3) Flush so unique-key races surface inside the mutation transaction.
    WalletTransaction saved = transactionRepository.saveAndFlush(tx);

    return toResponse(saved);
    }
    public Optional<TransactionResponse> getLatestTransactionForWallet(Wallet wallet){
        if (wallet == null) {
            throw new IllegalArgumentException("Wallet cannot be null");
        }

        return transactionRepository
                .findFirstByWalletOrderByCreatedAtDesc(wallet)
            .map(this::toResponse);
        }
    public Page<TransactionResponse> getRecentTransactions(Long userId, int page, int size){
         if (userId == null) {
        throw new IllegalArgumentException("UserId cannot be null");
        }
        if (page < 0) {
            throw new IllegalArgumentException("Page index must be >= 0");
        }
        if (size <= 0) {
            throw new IllegalArgumentException("Page size must be > 0");
        }

        // 2) make sure the wallet exists
        Wallet wallet = walletRepository.findByUser_Id(userId)
                .orElseThrow(() -> new IllegalArgumentException("Wallet does not exist for user"));

        // 3) build paging + sort (newest first)
        Sort sort = Sort.by(Sort.Direction.DESC, "createdAt");
        Pageable pageable = PageRequest.of(page, size, sort);

        // 4) query just by wallet (no date range)
        Page<WalletTransaction> txPage =
                transactionRepository.findByWalletOrderByCreatedAtDesc(wallet, pageable);

        // 5) map entities -> DTOs
        return txPage.map(this::toResponse);
    }
    public Optional<TransactionResponse> findByIdempotencyKey(String idempotencyKey){
        if(idempotencyKey==null||idempotencyKey.isBlank()){
            throw new IllegalArgumentException("IDE key cannot be null");
        }
        return transactionRepository
            .findByIdempotencyKey(idempotencyKey.trim())
            .map(this::toResponse);




    }
    public Page<TransactionResponse> getTransactionsByDateRange(Long userId,Instant from, Instant to, int page, int size){
        if(userId==null){
            throw new IllegalArgumentException("UserId cannot be null");
        }
        if (from == null || to == null) {
            throw new IllegalArgumentException("Date range bounds cannot be null");
        }
        if(from.isAfter(to)){
            throw new IllegalArgumentException("Date time not correct");
        }
        if(page<0){
            throw new IllegalArgumentException("Cannot access when page <0");
        }
        if(size<=0){
            throw new IllegalArgumentException("Page size must be > 0");
        }
        Wallet wallet = walletRepository.findByUser_Id(userId)
                .orElseThrow(() -> new IllegalArgumentException("Wallet does not exist for user"));

        //Building Page + sorting
        Sort sort = Sort.by(Sort.Direction.DESC, "createdAt");
        Pageable pageable = PageRequest.of(page, size, sort);
        LocalDateTime utcFrom = LocalDateTime.ofInstant(from, ZoneOffset.UTC);
        LocalDateTime utcTo = LocalDateTime.ofInstant(to, ZoneOffset.UTC);
        Page<WalletTransaction>txPage = transactionRepository
            .findByWalletAndCreatedAtBetweenOrderByCreatedAtDesc(wallet, utcFrom, utcTo, pageable);
        return txPage.map(this::toResponse);




    }

    private TransactionResponse toResponse(WalletTransaction transaction){
        TransactionResponse present = new TransactionResponse();
        present.setTransactionId(transaction.getId());
        present.setWalletId(transaction.getWallet().getId());
        present.setAmountCents(Math.abs(transaction.getDeltaCents()));
        present.setType(transaction.getDeltaCents() > 0 ? "CREDIT" : "DEBIT");
        present.setStatus("SUCCEEDED");
        present.setIdempotencyKey(transaction.getIdempotencyKey());
        present.setRefId(transaction.getRefId());
        present.setBalanceAfterCents(transaction.getBalanceAfterCents());
        if (transaction.getCreatedAt() != null) {
            present.setCreatedAt(transaction.getCreatedAt().toInstant(ZoneOffset.UTC));
        }
        return present;
    }
}