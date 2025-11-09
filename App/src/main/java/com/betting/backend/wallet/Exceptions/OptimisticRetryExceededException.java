package com.betting.backend.wallet.Exceptions;

/**
 * Thrown when optimistic locking retries are exhausted while updating a wallet.
 */
public class OptimisticRetryExceededException extends RuntimeException {

    private final Long walletId;
    private final int maxRetries;
    private static final String ERROR_CODE = "OPTIMISTIC_RETRY_EXCEEDED";

    public OptimisticRetryExceededException(Long walletId, int maxRetries) {
        super("Failed to update walletId=" + walletId + " after " + maxRetries + " optimistic locking retries");
        this.walletId = walletId;
        this.maxRetries = maxRetries;
    }

    public OptimisticRetryExceededException(Long walletId, int maxRetries, Throwable cause) {
        super("Failed to update walletId=" + walletId + " after " + maxRetries + " optimistic locking retries", cause);
        this.walletId = walletId;
        this.maxRetries = maxRetries;
    }

    public Long getWalletId() {
        return walletId;
    }

    public int getMaxRetries() {
        return maxRetries;
    }

    public String getErrorCode() {
        return ERROR_CODE;
    }
}
