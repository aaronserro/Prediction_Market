package com.betting.backend.wallet.dto;

import java.time.Instant;

import com.betting.backend.wallet.model.FundRequestStatus;

public class FundRequestResponse {
    private Long id;
    private Long Walletid;
    private Long userId;
    private String username;
    private Long amountCents;
    private String reason;
    private FundRequestStatus status;
    private Instant createdAt;
    private Instant processedAt; // can be null if still pending

    public Long getId() {
        return id;
    }
    public Long getWalletId(){
        return Walletid;
    }
    public void setWalletID(Long WalletId){
        this.Walletid=WalletId;
    }
    public Long getUserId() {
        return userId;
    }
    public void setUserId(Long userId) {
        this.userId = userId;
    }
    public String getUsername() {
        return username;
    }
    public void setUsername(String username) {
        this.username = username;
    }
    public void setId(Long id) {
        this.id = id;
    }

    public Long getAmountCents() {
        return amountCents;
    }

    public void setAmountCents(Long amountCents) {
        this.amountCents = amountCents;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public FundRequestStatus getStatus() {
        return status;
    }

    public void setStatus(FundRequestStatus status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getProcessedAt() {
        return processedAt;
    }

    public void setProcessedAt(Instant processedAt) {
        this.processedAt = processedAt;
    }

}
