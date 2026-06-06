package com.example.account_shield.alert;

import com.example.account_shield.alert.AlertEntity;
import com.example.account_shield.alert.AlertRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/analyst/alerts")
public class AlertController {

    private final AlertRepository alerts;

    public AlertController(AlertRepository alerts) {
        this.alerts = alerts;
    }

    @GetMapping
    public List<AlertEntity> listAlerts() {
        // For now, hardcode tenant 1 (the demo fund).
        // Later this comes from the logged-in user's token.
        return alerts.findByTenantIdOrderByCreatedAtDesc(1L);
    }
}