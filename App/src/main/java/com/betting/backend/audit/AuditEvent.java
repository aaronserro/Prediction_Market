package com.betting.backend.audit;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "audit_events")
public class AuditEvent {

    @Id
    private UUID id;

    @Column(name = "occurred_at", nullable = false, updatable = false)
    private Instant occurredAt;

    @Column(name = "actor_user_id", updatable = false)
    private Long actorUserId;

    @Column(nullable = false, length = 64, updatable = false)
    private String action;

    @Column(name = "target_type", nullable = false, length = 64, updatable = false)
    private String targetType;

    @Column(name = "target_id", length = 128, updatable = false)
    private String targetId;

    @Column(nullable = false, length = 16, updatable = false)
    private String outcome;

    @Column(name = "correlation_id", nullable = false, length = 64, updatable = false)
    private String correlationId;

    protected AuditEvent() {}

    public AuditEvent(Long actorUserId, String action, String targetType,
                      String targetId, String outcome, String correlationId) {
        this.id = UUID.randomUUID();
        this.occurredAt = Instant.now();
        this.actorUserId = actorUserId;
        this.action = action;
        this.targetType = targetType;
        this.targetId = targetId;
        this.outcome = outcome;
        this.correlationId = correlationId;
    }

    public UUID getId() { return id; }
    public Instant getOccurredAt() { return occurredAt; }
    public Long getActorUserId() { return actorUserId; }
    public String getAction() { return action; }
    public String getTargetType() { return targetType; }
    public String getTargetId() { return targetId; }
    public String getOutcome() { return outcome; }
    public String getCorrelationId() { return correlationId; }
}
