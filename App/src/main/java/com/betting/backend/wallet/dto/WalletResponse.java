package com.betting.backend.wallet.dto;

import java.time.Instant;

public class WalletResponse {
    private Long walletId;
    private long balanceCents;
    private Instant updatedAt;

    public WalletResponse() {
    }

    public WalletResponse(Long walletId, Long balanceCents, Instant updatedAt) {
        this.walletId = walletId;
        this.balanceCents = balanceCents;
        this.updatedAt = updatedAt;

    }

    public Long getWalletId() {
        return walletId;
    }

    public void setWalletId(Long walletId) {
        this.walletId = walletId;
    }

    public long getBalanceCents() {
        return balanceCents;
    }

    public void setBalanceCents(long balanceCents) {
        this.balanceCents = balanceCents;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }


}
