package com.example.account_shield.alert;

import com.example.account_shield.entity.User;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analyst/alerts")
public class AlertController {

    private final AlertRepository alerts;

    public AlertController(AlertRepository alerts) {
        this.alerts = alerts;
    }

    @GetMapping
    public List<AlertEntity> listAlerts(@AuthenticationPrincipal User user) {
        return alerts.findByTenantIdOrderByCreatedAtDesc(user.getTenantId());
    }

    @PostMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@AuthenticationPrincipal User analyst,
                                          @PathVariable Long id,
                                          @RequestBody Map<String, String> body) {
        var opt = alerts.findById(id);
        if (opt.isEmpty()) return ResponseEntity.status(404).body(Map.of("error", "alert not found"));
        AlertEntity alert = opt.get();
        // tenant check: analyst can only act on their own tenant's alerts
        if (!alert.getTenantId().equals(analyst.getTenantId())) {
            return ResponseEntity.status(403).body(Map.of("error", "not your tenant's alert"));
        }
        AlertStatus newStatus = AlertStatus.valueOf(body.get("status"));
        alert.setStatus(newStatus);
        alerts.save(alert);
        return ResponseEntity.ok(Map.of("id", alert.getId(), "status", alert.getStatus().name()));
    }
}