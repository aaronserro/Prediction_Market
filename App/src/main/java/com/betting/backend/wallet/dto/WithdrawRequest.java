package com.betting.backend.wallet.dto;

public class WithdrawRequest {
    private long amountCents;
    private String refId;
    public WithdrawRequest() {
    }

    public WithdrawRequest(long amountCents, String refId) {
        this.amountCents = amountCents;
        this.refId = refId;
    }

    public long getAmountCents() {
        return amountCents;
    }

    public void setAmountCents(long amountCents) {
        this.amountCents = amountCents;
    }
    public String getRefId() {
        return refId;
    }

    public void setRefId(String refId) {
        this.refId = refId;
    }
}
