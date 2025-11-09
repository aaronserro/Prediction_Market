package com.betting.backend.wallet.Service;

import com.betting.backend.wallet.model.Wallet;
import com.betting.backend.wallet.dto.TransactionResponse;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Optional;
@Service
public interface WalletTransactionService {

    /**
     * Append an immutable ledger entry. If idempotencyKey already exists:
     *  - return the existing matching transaction,
     *  - or throw if payload conflicts (handled in impl).
     */
    TransactionResponse appendTransaction(
            Wallet wallet,
            long deltaCents,
            long balanceAfterCents,
            String idempotencyKey,
            String refId
    );

    /** Lookup an existing transaction by idempotency key. */
    Optional<TransactionResponse> findByIdempotencyKey(String idempotencyKey);

    /** Most-recent-first, paginated history for a user. */
    Page<TransactionResponse> getRecentTransactions(Long userId, int page, int size);

    /** Filtered history window, paginated. */
    Page<TransactionResponse> getTransactionsByDateRange(
            Long userId,
            Instant from,
            Instant to,
            int page,
            int size
    );

    /** Latest transaction for a wallet (or Optional.empty() if none). */
    Optional<TransactionResponse> getLatestTransactionForWallet(Wallet wallet);
}
