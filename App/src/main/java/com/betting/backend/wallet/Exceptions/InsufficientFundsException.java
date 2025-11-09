package com.betting.backend.wallet.Exceptions;

/**
 * Thrown when a debit operation is requested but the wallet balance is insufficient.
 */
public class InsufficientFundsException extends RuntimeException {

    private final Long userId;
    private final Long walletId;
    private final long amountCents;
    private final long balanceCents;

    private static final String ERROR_CODE = "INSUFFICIENT_FUNDS";

    public InsufficientFundsException(Long userId, long amountCents, long balanceCents) {
        super("Insufficient funds: requested=" + amountCents + "c, available=" + balanceCents + "c for userId=" + userId);
        this.userId = userId;
        this.walletId = null;
        this.amountCents = amountCents;
        this.balanceCents = balanceCents;
    }

    public InsufficientFundsException(Long userId, Long walletId, long amountCents, long balanceCents) {
        super("Insufficient funds: requested=" + amountCents + "c, available=" + balanceCents + "c for userId=" + userId + ", walletId=" + walletId);
        this.userId = userId;
        this.walletId = walletId;
        this.amountCents = amountCents;
        this.balanceCents = balanceCents;
    }

    public Long getUserId() {
        return userId;
    }

    public Long getWalletId() {
        return walletId;
    }

    public long getAmountCents() {
        return amountCents;
    }

    public long getBalanceCents() {
        return balanceCents;
    }

    public String getErrorCode() {
        return ERROR_CODE;
    }
}
