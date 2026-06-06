package com.example.account_shield.alert;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;

public interface AlertRepository extends JpaRepository<AlertEntity, Long> {

    List<AlertEntity> findByTenantIdOrderByCreatedAtDesc(Long tenantId);

    @Query("""
        SELECT COUNT(a) FROM AlertEntity a
        WHERE a.type = :type
        AND a.details LIKE :pattern
        AND a.status = com.example.account_shield.alert.AlertStatus.OPEN
        AND a.createdAt > :since
    """)
    long countRecentOpenAlerts(@Param("type") AlertType type,
                               @Param("pattern") String pattern,
                               @Param("since") OffsetDateTime since);
}