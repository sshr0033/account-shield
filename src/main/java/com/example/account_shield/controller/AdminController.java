package com.example.account_shield.controller;

import com.example.account_shield.ratelimit.RateLimiterService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.account_shield.alert.AlertEntity;
import com.example.account_shield.alert.AlertRepository;
import com.example.account_shield.entity.LoginAttempt;
import com.example.account_shield.repository.LoginAttemptRepository;
import org.springframework.data.domain.PageRequest;

import java.util.List;
import com.example.account_shield.entity.User;
import com.example.account_shield.repository.UserRepository;
import java.util.Map;
import java.util.stream.Collectors;


@RestController
@RequestMapping("/api/platform-admin")
public class AdminController {

    private final RateLimiterService rateLimiter;
    private final AlertRepository alerts;
    private final LoginAttemptRepository loginAttempts;
    private final UserRepository userRepo;

    public AdminController(RateLimiterService rateLimiter,
                           AlertRepository alerts,
                           LoginAttemptRepository loginAttempts, UserRepository userRepo) {
        this.rateLimiter = rateLimiter;
        this.alerts = alerts;
        this.loginAttempts = loginAttempts;
        this.userRepo = userRepo;
    }


    @DeleteMapping("/users/{userId}")
    public ResponseEntity<?> deleteUser(@PathVariable Long userId) {
        userRepo.deleteById(userId);
        return ResponseEntity.ok(Map.of("message", "User deleted", "userId", userId));
    }

    @GetMapping("/tenants/{tenantId}/users")
    public List<Map<String, Object>> tenantUsers(@PathVariable Long tenantId) {
        return userRepo.findByTenantId(tenantId).stream()
                .map(u -> Map.<String, Object>of(
                        "id", u.getId(),
                        "email", u.getEmail(),
                        "role", u.getRole().name()
                ))
                .collect(Collectors.toList());
    }
    @PostMapping("/reset-blocks")
    public ResponseEntity<?> resetBlocks() {
        rateLimiter.resetAll();
        return ResponseEntity.ok(Map.of("message", "All IP blocks have been cleared."));
    }

    // Platform admin: view a specific tenant's alerts
    @GetMapping("/tenants/{tenantId}/alerts")
    public List<AlertEntity> tenantAlerts(@PathVariable Long tenantId) {
        return alerts.findByTenantIdOrderByCreatedAtDesc(tenantId);
    }

    // Platform admin: view a specific tenant's recent login attempts
    @GetMapping("/tenants/{tenantId}/login-attempts")
    public List<LoginAttempt> tenantLoginAttempts(@PathVariable Long tenantId) {
        return loginAttempts.findByTenantIdOrderByCreatedAtDesc(tenantId, PageRequest.of(0, 50));
    }
}