package com.example.account_shield.alert;

import com.example.account_shield.entity.User;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
    public List<AlertEntity> listAlerts(@AuthenticationPrincipal User user) {
        return alerts.findByTenantIdOrderByCreatedAtDesc(user.getTenantId());
    }
}