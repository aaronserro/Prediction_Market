package com.betting.backend.config;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import com.betting.backend.wallet.Exceptions.AmountInvalidException;
import com.betting.backend.wallet.Exceptions.BusinessValidationException;
import com.betting.backend.wallet.Exceptions.DuplicateOperationException;
import com.betting.backend.wallet.Exceptions.InsufficientFundsException;
import com.betting.backend.wallet.Exceptions.OptimisticRetryExceededException;
import com.betting.backend.wallet.Exceptions.WalletNotFoundException;

/**
 * Returns a consistent JSON error body: {timestamp, status, error, message, code}.
 * Unhandled exceptions fall through to Spring's default handling (generic 500, no message).
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(InsufficientFundsException.class)
    public ResponseEntity<Map<String, Object>> insufficientFunds(InsufficientFundsException ex) {
        String message = "Insufficient balance: requested " + ex.getAmountCents()
                + " PZC, available " + ex.getBalanceCents() + " PZC";
        return body(HttpStatus.CONFLICT, message, ex.getErrorCode());
    }

    @ExceptionHandler(WalletNotFoundException.class)
    public ResponseEntity<Map<String, Object>> walletNotFound(WalletNotFoundException ex) {
        return body(HttpStatus.NOT_FOUND, "Wallet not found", ex.getErrorCode());
    }

    @ExceptionHandler(OptimisticRetryExceededException.class)
    public ResponseEntity<Map<String, Object>> retryExceeded(OptimisticRetryExceededException ex) {
        return body(HttpStatus.CONFLICT, "Your wallet is busy; please try again", ex.getErrorCode());
    }

    @ExceptionHandler(DuplicateOperationException.class)
    public ResponseEntity<Map<String, Object>> duplicate(DuplicateOperationException ex) {
        return body(HttpStatus.CONFLICT, ex.getMessage(), ex.getErrorCode());
    }

    @ExceptionHandler(AmountInvalidException.class)
    public ResponseEntity<Map<String, Object>> amountInvalid(AmountInvalidException ex) {
        return body(HttpStatus.BAD_REQUEST, ex.getMessage(), ex.getErrorCode());
    }

    @ExceptionHandler(BusinessValidationException.class)
    public ResponseEntity<Map<String, Object>> businessValidation(BusinessValidationException ex) {
        return body(HttpStatus.BAD_REQUEST, ex.getMessage(), ex.getCode());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> invalidBody(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .orElse("Invalid request");
        return body(HttpStatus.BAD_REQUEST, message, "VALIDATION_FAILED");
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> illegalArgument(IllegalArgumentException ex) {
        return body(HttpStatus.BAD_REQUEST, ex.getMessage(), "BAD_REQUEST");
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, Object>> illegalState(IllegalStateException ex) {
        return body(HttpStatus.CONFLICT, ex.getMessage(), "CONFLICT");
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> responseStatus(ResponseStatusException ex) {
        return body(ex.getStatusCode(), ex.getReason(), null);
    }

    private static ResponseEntity<Map<String, Object>> body(HttpStatusCode status, String message, String code) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", Instant.now());
        body.put("status", status.value());
        HttpStatus resolved = HttpStatus.resolve(status.value());
        body.put("error", resolved != null ? resolved.getReasonPhrase() : "Error");
        body.put("message", message != null ? message : "Request failed");
        if (code != null) {
            body.put("code", code);
        }
        return ResponseEntity.status(status).body(body);
    }
}
