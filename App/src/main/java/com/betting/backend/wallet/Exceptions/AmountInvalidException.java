package com.betting.backend.wallet.Exceptions;

/**
 * Thrown when a wallet operation receives an invalid amount (e.g., <= 0).
 */
public class AmountInvalidException extends RuntimeException {

    private final long amountCents;
    private final String reason;
    private static final String ERROR_CODE = "AMOUNT_INVALID";

    public AmountInvalidException(long amountCents) {
        super("Invalid amount: " + amountCents + " (Amount must be greater than 0)");
        this.amountCents = amountCents;
        this.reason = "Amount must be greater than 0";
    }

    public AmountInvalidException(long amountCents, String reason) {
        super("Invalid amount: " + amountCents + " (" + reason + ")");
        this.amountCents = amountCents;
        this.reason = reason;
    }

    public long getAmountCents() {
        return amountCents;
    }

    public String getReason() {
        return reason;
    }

    public String getErrorCode() {
        return ERROR_CODE;
    }
}
