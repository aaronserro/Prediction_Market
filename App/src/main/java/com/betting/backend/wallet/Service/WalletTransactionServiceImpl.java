package com.betting.backend.wallet.Service;

import java.time.Instant;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import com.betting.backend.wallet.model.Wallet;
import com.betting.backend.wallet.model.WalletTransaction;

import jakarta.transaction.Transactional;
 import org.springframework.data.domain.Pageable;
import com.betting.backend.wallet.Exceptions.DuplicateOperationException;
import com.betting.backend.wallet.Exceptions.WalletNotFoundException;
import com.betting.backend.wallet.Repository.*;
import com.betting.backend.wallet.dto.TransactionResponse;
@Service
public class WalletTransactionServiceImpl implements WalletTransactionService {
    private WalletTransactionRepository TransactionRepository;
    private WalletRepository walletRepo;
    public WalletTransactionServiceImpl(WalletTransactionRepository repo){
        this.TransactionRepository = repo;
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

    // 2) idempotency short-circuit (scoped to this wallet)
    Optional<WalletTransaction> existing =
            TransactionRepository.findByIdempotencyKey(key);
    if (existing.isPresent()) {
        return DTOResponseWrapper(existing.get());
    }

    // 3) build new immutable transaction
    WalletTransaction tx = new WalletTransaction();
    tx.setWallet(wallet);
    tx.setDeltaCents(deltaCents);
    tx.setBalanceAfterCents(balanceAfterCents);
    tx.setIdempotencyKey(key);
    tx.onCreate();

    // 4) persist
    WalletTransaction saved = TransactionRepository.save(tx);

    // 5) map + return
    return DTOResponseWrapper(saved);
    }
    public Optional<TransactionResponse> getLatestTransactionForWallet(Wallet wallet){
        if (wallet == null) {
            throw new IllegalArgumentException("Wallet cannot be null");
        }

        return TransactionRepository
                .findFirstByWalletOrderByCreatedAtDesc(wallet)
                .map(this::DTOResponseWrapper);
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
        Wallet wallet = walletRepo.findByUser_Id(userId)
                .orElseThrow(() -> new IllegalArgumentException("Wallet does not exist for user"));

        // 3) build paging + sort (newest first)
        Sort sort = Sort.by(Sort.Direction.DESC, "createdAt");
        Pageable pageable = PageRequest.of(page, size, sort);

        // 4) query just by wallet (no date range)
        Page<WalletTransaction> txPage =
                TransactionRepository.findByWalletOrderByCreatedAtDesc(wallet, pageable);

        // 5) map entities -> DTOs
        return txPage.map(this::DTOResponseWrapper);
    }
    public Optional<TransactionResponse> findByIdempotencyKey(String idempotencyKey){
        if(idempotencyKey==null||idempotencyKey.isBlank()){
            throw new IllegalArgumentException("IDE key cannot be null");
        }
        return TransactionRepository
                .findByIdempotencyKey(idempotencyKey)   // global uniqueness assumed
                .map(this::DTOResponseWrapper);




    }
    public Page<TransactionResponse> getTransactionsByDateRange(Long userId,Instant from, Instant to, int page, int size){
        if(userId==null){
            throw new IllegalArgumentException("UserId cannot be null");
        }
        if(from.isAfter(to)){
            throw new IllegalArgumentException("Date time not correct");
        }
        if(page<0){
            throw new IllegalArgumentException("Cannot access when page <0");
        }
        if(!walletRepo.existsByUser_Id(userId)){
            throw new IllegalArgumentException("Wallet does not exist for user");

        }
        Wallet wallet = walletRepo.findByUser_Id(userId).orElseThrow(() -> new IllegalArgumentException("Wallet does not exist for user"));

        //Building Page + sorting
        Sort sort = Sort.by(Sort.Direction.DESC, "createdAt");
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<WalletTransaction>txPage = TransactionRepository.findByWalletAndCreatedAtBetweenOrderByCreatedAtDesc(wallet, from, to, pageable);
        return txPage.map(this::DTOResponseWrapper);




    }

    private TransactionResponse DTOResponseWrapper(WalletTransaction transaction){
        TransactionResponse present = new TransactionResponse();
        present.setAmountCents(transaction.getBalanceAfterCents());
        present.setIdempotencyKey(transaction.getIdempotencyKey());
        present.setTransactionId(transaction.getId());
        return present;
    }
}