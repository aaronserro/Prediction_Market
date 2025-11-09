package com.betting.backend.wallet.Repository;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.betting.backend.wallet.model.Wallet;
import com.betting.backend.wallet.model.WalletTransaction;

@Repository
public interface WalletTransactionRepository extends JpaRepository<WalletTransaction, Long> {

    // Recent-first history for a wallet (full list)
    List<WalletTransaction> findByWalletOrderByCreatedAtDesc(Wallet wallet);

    // Paginated history for a wallet
    Page<WalletTransaction> findByWalletOrderByCreatedAtDesc(Wallet wallet, Pageable pageable);

    // Filter by date range (inclusive) + pagination, recent-first
    Page<WalletTransaction> findByWalletAndCreatedAtBetweenOrderByCreatedAtDesc(
            Wallet wallet,
            Instant from,
            Instant to,
            Pageable pageable
    );


    // Latest single transaction (useful for quick checks / reconciliation)
    Optional<WalletTransaction> findFirstByWalletOrderByCreatedAtDesc(Wallet wallet);

    // Exactly-once protection: look up by idempotency key
    Optional<WalletTransaction> findByIdempotencyKey(String idempotencyKey);
}
