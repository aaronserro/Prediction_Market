package com.betting.backend.wallet.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Entity
@Table(
    name = "wallet_transactions",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_wallet_tx_idempotency", columnNames = "idempotency_key")
    },
    indexes = {
        @Index(name = "idx_wallet_tx_wallet_created", columnList = "wallet_id, created_at")
    }
)
public class WalletTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Each transaction belongs to one wallet (not unique; many transactions per wallet)
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "wallet_id", nullable = false)
    private Wallet wallet;

    // Signed delta in cents: positive = credit, negative = debit
    @Column(name = "delta_cents", nullable = false)
    private long deltaCents;

    // Snapshot of the wallet balance immediately after applying this transaction
    @Column(name = "balance_after_cents", nullable = false)
    private long balanceAfterCents;

    // Used to ensure exactly-once semantics on retries
    @Column(name = "idempotency_key", nullable = false, length = 128)
    private String idempotencyKey;

    // Optional business reference such as a trade, transfer, or settlement ID
    @Column(name = "ref_id", length = 255)
    private String refId;

    // Auditing
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public WalletTransaction() {}

    public WalletTransaction(Wallet wallet, long deltaCents, long balanceAfterCents, String idempotencyKey) {
        this.wallet = wallet;
        this.deltaCents = deltaCents;
        this.balanceAfterCents = balanceAfterCents;
        this.idempotencyKey = idempotencyKey;
    }

    @PrePersist
    public void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now(ZoneOffset.UTC);
        }
    }

    // Getters & setters

    public Long getId() {
        return id;
    }

    public Wallet getWallet() {
        return wallet;
    }

    public void setWallet(Wallet wallet) {
        this.wallet = wallet;
    }

    public long getDeltaCents() {
        return deltaCents;
    }

    public void setDeltaCents(long deltaCents) {
        this.deltaCents = deltaCents;
    }

    public long getBalanceAfterCents() {
        return balanceAfterCents;
    }

    public void setBalanceAfterCents(long balanceAfterCents) {
        this.balanceAfterCents = balanceAfterCents;
    }

    public String getIdempotencyKey() {
        return idempotencyKey;
    }

    public void setIdempotencyKey(String idempotencyKey) {
        this.idempotencyKey = idempotencyKey;
    }

    public String getRefId() {
        return refId;
    }

    public void setRefId(String refId) {
        this.refId = refId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
