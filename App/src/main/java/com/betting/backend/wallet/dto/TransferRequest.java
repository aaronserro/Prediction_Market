package com.betting.backend.wallet.dto;

public class TransferRequest {
    private Long fromWalletId;
    private Long toWalletId;
    private long amountCents;
    private String refId;
    public TransferRequest() {
    }

    public TransferRequest(Long fromWalletId, Long toWalletId, long amountCents, String refId) {
        this.fromWalletId = fromWalletId;
        this.toWalletId = toWalletId;
        this.amountCents = amountCents;
        this.refId = refId;
    }
    public String getRefId() {
        return refId;
    }

    public void setRefId(String refId) {
        this.refId = refId;
    }
    public Long getFromWalletId() {
        return fromWalletId;
    }

    public void setFromWalletId(Long fromWalletId) {
        this.fromWalletId = fromWalletId;
    }

    public Long getToWalletId() {
        return toWalletId;
    }

    public void setToWalletId(Long toWalletId) {
        this.toWalletId = toWalletId;
    }

    public long getAmountCents() {
        return amountCents;
    }

    public void setAmountCents(long amountCents) {
        this.amountCents = amountCents;
    }
}
