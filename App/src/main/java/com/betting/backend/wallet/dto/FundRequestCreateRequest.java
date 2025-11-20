package com.betting.backend.wallet.dto;

public class FundRequestCreateRequest {
        // Amount in cents (e.g. $100.00 -> 10000)
    private Long amountCents;

    // Free-text reason from the user
    private String reason;

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

}
