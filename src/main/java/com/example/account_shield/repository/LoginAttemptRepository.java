package com.example.account_shield.repository;

import com.example.account_shield.entity.LoginAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;

public interface LoginAttemptRepository extends JpaRepository<LoginAttempt, Long> {

    @Query("""
        SELECT COUNT(*) FROM LoginAttempt la
        WHERE la.emailAttempted = :email
        AND la.success = false
        AND la.createdAt > :since
    """)
    long countFailedAttemptsForEmail(@Param("email") String email, @Param("since") OffsetDateTime since);

    @Query("""
        SELECT COUNT(DISTINCT la.emailAttempted) FROM LoginAttempt la
        WHERE la.ipAddress = :ip
        AND la.success = false
        AND la.createdAt > :since
    """)
    long countDistinctEmailsAttackedFromIp(@Param("ip") String ip, @Param("since") OffsetDateTime since);
}