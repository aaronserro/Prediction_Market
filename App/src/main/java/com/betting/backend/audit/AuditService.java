package com.betting.backend.audit;

import java.util.regex.Pattern;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.betting.backend.config.RequestCorrelationFilter;

@Service
public class AuditService {

    private static final Pattern SAFE_ACTION = Pattern.compile("^[A-Z0-9_]{1,64}$");
    private static final Pattern SAFE_TARGET_TYPE = Pattern.compile("^[A-Z0-9_]{1,64}$");
    private static final Pattern SAFE_IDENTIFIER = Pattern.compile("^[A-Za-z0-9:_-]{1,128}$");

    private final AuditEventRepository events;

    public AuditService(AuditEventRepository events) {
        this.events = events;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void success(Long actorId, String action, String targetType, String targetId) {
        append(actorId, action, targetType, targetId, "SUCCESS",
                RequestCorrelationFilter.currentCorrelationId());
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void rejected(Long actorId, String action, String targetType, String targetId) {
        append(actorId, action, targetType, targetId, "REJECTED",
                RequestCorrelationFilter.currentCorrelationId());
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void success(Long actorId, String action, String targetType,
                        String targetId, String correlationId) {
        append(actorId, action, targetType, targetId, "SUCCESS", correlationId);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void rejected(Long actorId, String action, String targetType,
                         String targetId, String correlationId) {
        append(actorId, action, targetType, targetId, "REJECTED", correlationId);
    }

    private void append(Long actorId, String action, String targetType,
                        String targetId, String outcome, String correlationId) {
        requireSafe(action, SAFE_ACTION, "audit action");
        requireSafe(targetType, SAFE_TARGET_TYPE, "audit target type");
        if (targetId != null) {
            requireSafe(targetId, SAFE_IDENTIFIER, "audit target ID");
        }
        requireSafe(correlationId, SAFE_IDENTIFIER, "correlation ID");
        events.save(new AuditEvent(
                actorId, action, targetType, targetId, outcome, correlationId));
    }

    private void requireSafe(String value, Pattern pattern, String field) {
        if (value == null || !pattern.matcher(value).matches()) {
            throw new IllegalArgumentException("Invalid " + field);
        }
    }
}
