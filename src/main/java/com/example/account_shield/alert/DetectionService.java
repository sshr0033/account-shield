package com.example.account_shield.alert;

import com.example.account_shield.alert.AlertEntity;
import com.example.account_shield.alert.AlertRepository;
import com.example.account_shield.alert.AlertSeverity;
import com.example.account_shield.alert.AlertStatus;
import com.example.account_shield.alert.AlertType;
import com.example.account_shield.entity.LoginAttempt;
import com.example.account_shield.repository.LoginAttemptRepository;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;

@Service
public class DetectionService {

    private final LoginAttemptRepository loginAttempts;
    private final AlertRepository alerts;

    public DetectionService(LoginAttemptRepository loginAttempts, AlertRepository alerts) {
        this.loginAttempts = loginAttempts;
        this.alerts = alerts;
    }

    public void analyzeAttempt(LoginAttempt attempt) {
        if (attempt.isSuccess()) {
            return;
        }

        long failedForEmail = loginAttempts.countFailedAttemptsForEmail(
                attempt.getEmailAttempted(),
                OffsetDateTime.now().minusMinutes(10)
        );
        if (failedForEmail >= 5) {
            createAlertIfNew(
                    attempt.getTenantId(),
                    AlertType.BRUTE_FORCE,
                    AlertSeverity.HIGH,
                    "Brute-force: " + failedForEmail + " failed attempts on "
                            + attempt.getEmailAttempted() + " in 10 minutes",
                    attempt.getEmailAttempted(),   // the "target" to dedupe on
                    attempt.getId()
            );
            return;
        }

        long distinctEmailsFromIp = loginAttempts.countDistinctEmailsAttackedFromIp(
                attempt.getIpAddress(),
                OffsetDateTime.now().minusMinutes(5)
        );
        if (distinctEmailsFromIp >= 10) {
            createAlertIfNew(
                    attempt.getTenantId(),
                    AlertType.CREDENTIAL_STUFFING,
                    AlertSeverity.HIGH,
                    "Credential-stuffing: " + distinctEmailsFromIp + " different accounts attacked from IP "
                            + attempt.getIpAddress() + " in 5 minutes",
                    attempt.getIpAddress(),        // the "target" to dedupe on
                    attempt.getId()
            );
        }
    }

    private void createAlertIfNew(Long tenantId, AlertType type, AlertSeverity severity,
                                  String details, String target, Long loginAttemptId) {
        // dedupe: if an OPEN alert of this type for this target already exists
        // in the last 15 minutes, don't create another one
        long existing = alerts.countRecentOpenAlerts(
                type,
                "%" + target + "%",
                OffsetDateTime.now().minusMinutes(15)
        );
        if (existing > 0) {
            return;  // already alerted on this attack — skip
        }

        AlertEntity alert = new AlertEntity();
        alert.setTenantId(tenantId);
        alert.setType(type);
        alert.setSeverity(severity);
        alert.setDetails(details);
        alert.setLoginAttemptId(loginAttemptId);
        alert.setStatus(AlertStatus.OPEN);
        alerts.save(alert);
    }
}