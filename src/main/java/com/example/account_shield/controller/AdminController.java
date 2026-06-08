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
import com.example.account_shield.entity.Enquiry;
import com.example.account_shield.entity.Tenant;
import com.example.account_shield.entity.User;
import com.example.account_shield.domain.Role;
import com.example.account_shield.repository.EnquiryRepository;
import com.example.account_shield.repository.TenantRepository;
import org.springframework.security.crypto.password.PasswordEncoder;


@RestController
@RequestMapping("/api/platform-admin")
public class AdminController {

    private final RateLimiterService rateLimiter;
    private final AlertRepository alerts;
    private final LoginAttemptRepository loginAttempts;
    private final UserRepository userRepo;
    private final TenantRepository tenants;
    private final EnquiryRepository enquiries;
    private final PasswordEncoder encoder;

    public AdminController(RateLimiterService rateLimiter,
                           AlertRepository alerts,
                           LoginAttemptRepository loginAttempts, UserRepository userRepo, TenantRepository tenants, EnquiryRepository enquiries, PasswordEncoder encoder) {
        this.rateLimiter = rateLimiter;
        this.alerts = alerts;
        this.loginAttempts = loginAttempts;
        this.userRepo = userRepo;
        this.tenants = tenants;
        this.enquiries = enquiries;
        this.encoder = encoder;
    }


    @DeleteMapping("/users/{userId}")
    public ResponseEntity<?> deleteUser(@PathVariable Long userId) {
        userRepo.deleteById(userId);
        return ResponseEntity.ok(Map.of("message", "User deleted", "userId", userId));
    }
    // List all enquiries (newest first)
    @GetMapping("/enquiries")
    public List<Enquiry> listEnquiries() {
        return enquiries.findAllByOrderByCreatedAtDesc();
    }

    // Approve an enquiry → create tenant + first tenant admin, return temp password
    @PostMapping("/enquiries/{id}/approve")
    public ResponseEntity<?> approveEnquiry(@PathVariable Long id) {
        var opt = enquiries.findById(id);
        if (opt.isEmpty()) return ResponseEntity.status(404).body(Map.of("error", "enquiry not found"));
        Enquiry e = opt.get();
        if ("APPROVED".equals(e.getStatus())) {
            return ResponseEntity.status(409).body(Map.of("error", "already approved"));
        }
        if (userRepo.findByEmail(e.getContactEmail()).isPresent()) {
            return ResponseEntity.status(409).body(Map.of("error", "a user with that email already exists"));
        }

        // 1. create the tenant
        Tenant t = new Tenant();
        t.setName(e.getCompanyName());
        Tenant savedTenant = tenants.save(t);

        // 2. create the first tenant admin with a generated temp password
        String tempPassword = generateTempPassword();
        User admin = new User();
        admin.setTenantId(savedTenant.getId());
        admin.setEmail(e.getContactEmail());
        admin.setPasswordHash(encoder.encode(tempPassword));
        admin.setRole(Role.TENANT_ADMIN);
        userRepo.save(admin);

        // 3. mark enquiry approved
        e.setStatus("APPROVED");
        enquiries.save(e);

        return ResponseEntity.ok(Map.of(
                "message", "Tenant onboarded",
                "tenantId", savedTenant.getId(),
                "tenantName", savedTenant.getName(),
                "adminEmail", admin.getEmail(),
                "tempPassword", tempPassword   // shown once to the platform admin to relay
        ));
    }

    private String generateTempPassword() {
        // simple readable temp password for the demo
        return "Temp-" + java.util.UUID.randomUUID().toString().substring(0, 8) + "!";
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