package com.example.account_shield.alert;


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
        // only failed attempts are worth analyzing — a successful login isn't an attack
        if (attempt.isSuccess()) {
            return;
        }

        // BRUTE FORCE: many failed attempts against ONE email in 10 minutes
        long failedForEmail = loginAttempts.countFailedAttemptsForEmail(
                attempt.getEmailAttempted(),
                OffsetDateTime.now().minusMinutes(10)
        );
        if (failedForEmail >= 5) {
            createAlert(
                    attempt.getTenantId(),
                    AlertType.BRUTE_FORCE,
                    AlertSeverity.HIGH,
                    "Brute-force: " + failedForEmail + " failed attempts on "
                            + attempt.getEmailAttempted() + " in 10 minutes",
                    attempt.getId()
            );
            return;
        }

        // CREDENTIAL STUFFING: ONE IP failing against many DIFFERENT emails in 5 minutes
        long distinctEmailsFromIp = loginAttempts.countDistinctEmailsAttackedFromIp(
                attempt.getIpAddress(),
                OffsetDateTime.now().minusMinutes(5)
        );
        if (distinctEmailsFromIp >= 10) {
            createAlert(
                    attempt.getTenantId(),
                    AlertType.CREDENTIAL_STUFFING,
                    AlertSeverity.HIGH,
                    "Credential-stuffing: " + distinctEmailsFromIp + " different accounts attacked from IP "
                            + attempt.getIpAddress() + " in 5 minutes",
                    attempt.getId()
            );
        }
    }

    private void createAlert(Long tenantId, AlertType type, AlertSeverity severity,
                             String details, Long loginAttemptId) {
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