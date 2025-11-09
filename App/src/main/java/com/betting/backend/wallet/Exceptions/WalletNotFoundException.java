package com.betting.backend.wallet.Exceptions;

/**
 * Thrown when a wallet cannot be found for a given userId or walletId.
 */
public class WalletNotFoundException extends RuntimeException {

    private final Long userId;
    private final Long walletId;
    private static final String ERROR_CODE = "WALLET_NOT_FOUND";

    public WalletNotFoundException(Long userId) {
        super("Wallet not found for userId=" + userId);
        this.userId = userId;
        this.walletId = null;
    }

    public WalletNotFoundException(Long userId, Throwable cause) {
        super("Wallet not found for userId=" + userId, cause);
        this.userId = userId;
        this.walletId = null;
    }

    public WalletNotFoundException(Long userId, Long walletId) {
        super("Wallet not found for userId=" + userId + " or walletId=" + walletId);
        this.userId = userId;
        this.walletId = walletId;
    }

    public Long getUserId() {
        return userId;
    }

    public Long getWalletId() {
        return walletId;
    }

    public String getErrorCode() {
        return ERROR_CODE;
    }
}
