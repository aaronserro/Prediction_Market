package com.betting.backend.wallet.Exceptions;

/**
 * Thrown when a wallet operation with the same idempotency key has already been processed.
 */
public class DuplicateOperationException extends RuntimeException {

    private final String idempotencyKey;
    private final String operationType;
    private static final String ERROR_CODE = "DUPLICATE_OPERATION";

    public DuplicateOperationException(String idempotencyKey) {
        super("Duplicate operation detected for key: " + idempotencyKey);
        this.idempotencyKey = idempotencyKey;
        this.operationType = null;
    }

    public DuplicateOperationException(String idempotencyKey, String operationType) {
        super("Duplicate operation detected for key: " + idempotencyKey + " [type=" + operationType + "]");
        this.idempotencyKey = idempotencyKey;
        this.operationType = operationType;
    }

    public DuplicateOperationException(String idempotencyKey, String operationType, String message) {
        super(message);
        this.idempotencyKey = idempotencyKey;
        this.operationType = operationType;
    }

    public String getIdempotencyKey() {
        return idempotencyKey;
    }

    public String getOperationType() {
        return operationType;
    }

    public String getErrorCode() {
        return ERROR_CODE;
    }
}
