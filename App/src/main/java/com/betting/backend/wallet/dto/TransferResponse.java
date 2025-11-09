package com.betting.backend.wallet.dto;

import java.time.Instant;

public class TransferResponse {

    // Unique shared ID linking both debit + credit transactions
    private String transferId;

    // Information for sender (debit)
    private PartyResponse from;

    // Information for receiver (credit)
    private PartyResponse to;

    // Common fields
    private Long amountCents;
    private String idempotencyKey;
    private String refId;
    private Instant createdAt;

    public TransferResponse() {}

    public TransferResponse(String transferId, PartyResponse from, PartyResponse to,
                            Long amountCents, String idempotencyKey, String refId, Instant createdAt) {
        this.transferId = transferId;
        this.from = from;
        this.to = to;
        this.amountCents = amountCents;
        this.idempotencyKey = idempotencyKey;
        this.refId = refId;
        this.createdAt = createdAt;
    }

    // ---- Getters & Setters ----

    public String getTransferId() {
        return transferId;
    }

    public void setTransferId(String transferId) {
        this.transferId = transferId;
    }

    public PartyResponse getFrom() {
        return from;
    }

    public void setFrom(PartyResponse from) {
        this.from = from;
    }

    public PartyResponse getTo() {
        return to;
    }

    public void setTo(PartyResponse to) {
        this.to = to;
    }

    public Long getAmountCents() {
        return amountCents;
    }

    public void setAmountCents(Long amountCents) {
        this.amountCents = amountCents;
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

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    // ---- Inner DTO for sender/receiver summaries ----
    public static class PartyResponse {
        private Long userId;
        private String transactionId;
        private Long balanceAfterCents;

        public PartyResponse() {}

        public PartyResponse(Long userId, String transactionId, Long balanceAfterCents) {
            this.userId = userId;
            this.transactionId = transactionId;
            this.balanceAfterCents = balanceAfterCents;
        }

        public Long getUserId() {
            return userId;
        }

        public void setUserId(Long userId) {
            this.userId = userId;
        }

        public String getTransactionId() {
            return transactionId;
        }

        public void setTransactionId(String transactionId) {
            this.transactionId = transactionId;
        }

        public Long getBalanceAfterCents() {
            return balanceAfterCents;
        }

        public void setBalanceAfterCents(Long balanceAfterCents) {
            this.balanceAfterCents = balanceAfterCents;
        }
    }
}
