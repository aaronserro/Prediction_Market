package com.betting.backend.wallet.model;

import java.time.Instant;
import java.time.LocalDateTime;

import jakarta.persistence.*;

@Entity
@Table(name = "fund_requests")
public class FundRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Many fund requests belong to one wallet */
    @ManyToOne(optional = false)
    @JoinColumn(name = "wallet_id", nullable = false)
    private Wallet wallet;

    /** Amount in cents (never dollars to avoid float rounding issues) */
    @Column(name = "amount_cents", nullable = false)
    private Long amountCents;

    /** Optimistic locking version */
    @Version
    private Integer version;

    /** When the user created the request */
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    /** When the admin processed it; null if still PENDING */
    @Column(name = "processed_at")
    private Instant processedAt;

    /** Reason the user is requesting funds */
    @Column(name = "reason", length = 1000)
    private String reason;

    /** PENDING, APPROVED, REJECTED */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private FundRequestStatus status = FundRequestStatus.PENDING;

    /** Required by JPA */
    protected FundRequest() {}

    /** Constructor for PENDING fund requests */
    public FundRequest(Wallet wallet, Long amountCents, String reason) {
        this.wallet = wallet;
        this.amountCents = amountCents;
        this.reason = reason;
    }

    /** Set createdAt automatically */
    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
    }

    // --- Getters and setters ---

    public Long getId() { return id; }
    public Wallet getWallet() { return wallet; }
    public Long getAmountCents() { return amountCents; }
    public Integer getVersion() { return version; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getProcessedAt() { return processedAt; }
    public String getReason() { return reason; }
    public FundRequestStatus getStatus() { return status; }

    public void setProcessedAt(Instant processedAt) { this.processedAt = processedAt; }
    public void setStatus(FundRequestStatus status) { this.status = status; }

}
