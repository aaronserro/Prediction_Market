package com.betting.backend.wallet.Exceptions;

import java.util.Collections;
import java.util.Map;

/**
 * Generic domain/business rule violation.
 * Use specific exceptions when possible; fall back to this for named rules with context.
 */
public class BusinessValidationException extends RuntimeException {

    private final String code;
    private final Map<String, Object> details;

    public BusinessValidationException(String message) {
        super(message);
        this.code = "BUSINESS_VALIDATION_FAILED";
        this.details = Collections.emptyMap();
    }

    public BusinessValidationException(String code, String message) {
        super(message);
        this.code = code != null ? code : "BUSINESS_VALIDATION_FAILED";
        this.details = Collections.emptyMap();
    }

    public BusinessValidationException(String code, String message, Map<String, Object> details) {
        super(message);
        this.code = code != null ? code : "BUSINESS_VALIDATION_FAILED";
        this.details = details != null ? Collections.unmodifiableMap(details) : Collections.emptyMap();
    }

    public BusinessValidationException(String code, String message, Throwable cause) {
        super(message, cause);
        this.code = code != null ? code : "BUSINESS_VALIDATION_FAILED";
        this.details = Collections.emptyMap();
    }

    public BusinessValidationException(String code, String message, Map<String, Object> details, Throwable cause) {
        super(message, cause);
        this.code = code != null ? code : "BUSINESS_VALIDATION_FAILED";
        this.details = details != null ? Collections.unmodifiableMap(details) : Collections.emptyMap();
    }

    public String getCode() {
        return code;
    }

    public Map<String, Object> getDetails() {
        return details;
    }
}
