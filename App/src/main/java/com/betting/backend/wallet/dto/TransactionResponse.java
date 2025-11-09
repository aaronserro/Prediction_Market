package com.betting.backend.wallet.dto;

import java.time.Instant;

public class TransactionResponse {
    private Long transactionId;
    private Long walletId;
    private String type;      // e.g. "DEPOSIT", "WITHDRAW", "TRANSFER"
    private long amountCents;
    private String status;    // e.g. "PENDING", "SUCCEEDED", "FAILED"
    private String idempotencyKey;
    private Instant createdAt;

    public TransactionResponse() {
    }

    public TransactionResponse(Long transactionId, Long walletId, String type,
                               long amountCents, String status, String idempotencyKey,
                               Instant createdAt) {
        this.transactionId = transactionId;
        this.walletId = walletId;
        this.type = type;
        this.amountCents = amountCents;
        this.status = status;
        this.idempotencyKey = idempotencyKey;
        this.createdAt = createdAt;
    }



    public Long getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(Long transactionId) {
        this.transactionId = transactionId;
    }

    public Long getWalletId() {
        return walletId;
    }

    public void setWalletId(Long walletId) {
        this.walletId = walletId;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public long getAmountCents() {
        return amountCents;
    }

    public void setAmountCents(long amountCents) {
        this.amountCents = amountCents;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getIdempotencyKey() {
        return idempotencyKey;
    }

    public void setIdempotencyKey(String idempotencyKey) {
        this.idempotencyKey = idempotencyKey;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
