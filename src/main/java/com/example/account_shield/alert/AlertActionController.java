package com.example.account_shield.alert;

import com.example.account_shield.alert.AlertEntity;
import com.example.account_shield.alert.AlertRepository;
import com.example.account_shield.alert.AlertStatus;
import com.example.account_shield.entity.User;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import com.example.account_shield.entity.LoginAttempt;
import com.example.account_shield.repository.LoginAttemptRepository;
import com.example.account_shield.ratelimit.RateLimiterService;
import com.example.account_shield.alert.AlertStatus;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/analyst/alerts")
public class AlertActionController {

    private final AlertRepository alerts;
    private final LoginAttemptRepository loginAttempts;
    private final RateLimiterService rateLimiter;

    public AlertActionController(AlertRepository alerts,
                                 LoginAttemptRepository loginAttempts,
                                 RateLimiterService rateLimiter) {
        this.alerts = alerts;
        this.loginAttempts = loginAttempts;
        this.rateLimiter = rateLimiter;
    }

    // Helper: get the IP associated with an alert (via its login attempt)
    private String ipForAlert(AlertEntity a) {
        if (a.getLoginAttemptId() == null) return null;
        return loginAttempts.findById(a.getLoginAttemptId())
                .map(LoginAttempt::getIpAddress).orElse(null);
    }

    // Helper: load an alert and verify it belongs to the analyst's tenant
    private AlertEntity ownedAlert(Long id, User analyst) {
        Optional<AlertEntity> opt = alerts.findById(id);
        if (opt.isEmpty()) return null;
        AlertEntity a = opt.get();
        if (!a.getTenantId().equals(analyst.getTenantId())) return null;
        return a;
    }

    @PostMapping("/{id}/block-forever")
    public ResponseEntity<?> blockForever(@AuthenticationPrincipal User analyst, @PathVariable Long id) {
        AlertEntity a = ownedAlert(id, analyst);
        if (a == null) return ResponseEntity.status(404).body(Map.of("error", "alert not found in your tenant"));
        String ip = ipForAlert(a);
        if (ip != null) rateLimiter.blockForever(ip);
        a.setStatus(AlertStatus.BLOCKED);
        alerts.save(a);
        return ResponseEntity.ok(Map.of("id", a.getId(), "status", a.getStatus().name(), "blockedIp", ip == null ? "unknown" : ip));
    }

    @PostMapping("/{id}/release-block")
    public ResponseEntity<?> releaseBlock(@AuthenticationPrincipal User analyst, @PathVariable Long id) {
        AlertEntity a = ownedAlert(id, analyst);
        if (a == null) return ResponseEntity.status(404).body(Map.of("error", "alert not found in your tenant"));
        String ip = ipForAlert(a);
        if (ip != null) {
            rateLimiter.reset(ip);              // clear temporary block
            rateLimiter.releasePermanent(ip);   // clear permanent block
        }
        a.setStatus(AlertStatus.RESOLVED);      // releasing implies handled
        alerts.save(a);
        return ResponseEntity.ok(Map.of("id", a.getId(), "status", a.getStatus().name(), "releasedIp", ip == null ? "unknown" : ip));
    }

    @PostMapping("/{id}/resolve")
    public ResponseEntity<?> resolve(@AuthenticationPrincipal User analyst, @PathVariable Long id) {
        AlertEntity a = ownedAlert(id, analyst);
        if (a == null) return ResponseEntity.status(404).body(Map.of("error", "alert not found in your tenant"));
        a.setStatus(AlertStatus.RESOLVED);
        alerts.save(a);
        return ResponseEntity.ok(Map.of("id", a.getId(), "status", a.getStatus().name()));
    }
}