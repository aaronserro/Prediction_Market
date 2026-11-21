package com.betting.backend.audit;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.Repository;

public interface AuditEventRepository extends Repository<AuditEvent, UUID> {
    AuditEvent save(AuditEvent event);
    Page<AuditEvent> findAll(Pageable pageable);
}
