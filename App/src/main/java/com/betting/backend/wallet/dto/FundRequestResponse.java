package com.betting.backend.wallet.dto;

import java.time.LocalDateTime;

import com.betting.backend.wallet.model.FundRequestStatus;

public class FundRequestResponse {
    private Long id;
    private Long Walletid;
    private Long amountCents;
    private String reason;
    private FundRequestStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime processedAt; // can be null if still pending

    public Long getId() {
        return id;
    }
    public Long getWalletId(){
        return Walletid;
    }
    public void setWalletID(Long WalletId){
        this.Walletid=WalletId;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getProcessedAt() {
        return processedAt;
    }

    public void setProcessedAt(LocalDateTime processedAt) {
        this.processedAt = processedAt;
    }

}
