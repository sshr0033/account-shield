package com.example.account_shield.controller;

import com.example.account_shield.domain.Role;
import com.example.account_shield.entity.User;
import com.example.account_shield.repository.UserRepository;
import com.example.account_shield.web.dto.AuthDtos.RegisterRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import com.example.account_shield.entity.LoginAttempt;
import com.example.account_shield.ratelimit.RateLimiterService;
import com.example.account_shield.repository.LoginAttemptRepository;
import org.springframework.data.domain.PageRequest;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/tenant-admin")
public class TenantAdminController {

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final LoginAttemptRepository loginAttempts;
    private final RateLimiterService rateLimiter;

    public TenantAdminController(UserRepository users,
                                 PasswordEncoder encoder,
                                 LoginAttemptRepository loginAttempts,
                                 RateLimiterService rateLimiter) {
        this.users = users;
        this.encoder = encoder;
        this.loginAttempts = loginAttempts;
        this.rateLimiter = rateLimiter;
    }



    // List members of MY tenant only
    @GetMapping("/users")
    public List<Map<String, Object>> listMyUsers(@AuthenticationPrincipal User admin) {
        return users.findByTenantId(admin.getTenantId()).stream()
                .filter(u -> u.getRole() != Role.PLATFORM_ADMIN)
                .map(u -> Map.<String, Object>of(
                        "id", u.getId(),
                        "email", u.getEmail(),
                        "role", u.getRole().name()
                ))
                .collect(Collectors.toList());
    }

    // A specific member's recent login attempts (tenant-checked)
    @GetMapping("/users/{id}/login-attempts")
    public ResponseEntity<?> memberLoginAttempts(@AuthenticationPrincipal User admin,
                                                 @PathVariable Long id) {
        var opt = users.findById(id);
        if (opt.isEmpty()) return ResponseEntity.status(404).body(Map.of("error", "user not found"));
        User member = opt.get();
        if (!member.getTenantId().equals(admin.getTenantId())) {
            return ResponseEntity.status(403).body(Map.of("error", "not your tenant's user"));
        }
        List<LoginAttempt> attempts = loginAttempts
                .findByEmailAttemptedOrderByCreatedAtDesc(member.getEmail(), PageRequest.of(0, 50));
        return ResponseEntity.ok(Map.of(
                "email", member.getEmail(),
                "recentFailureCount", rateLimiter.currentCountForEmail(member.getEmail()),
                "attempts", attempts
        ));
    }

    // Reset a specific member's block (tenant-checked)
    @PostMapping("/users/{id}/reset-block")
    public ResponseEntity<?> resetMemberBlock(@AuthenticationPrincipal User admin,
                                              @PathVariable Long id) {
        var opt = users.findById(id);
        if (opt.isEmpty()) return ResponseEntity.status(404).body(Map.of("error", "user not found"));
        User member = opt.get();
        if (!member.getTenantId().equals(admin.getTenantId())) {
            return ResponseEntity.status(403).body(Map.of("error", "not your tenant's user"));
        }
        rateLimiter.resetForEmail(member.getEmail());
        return ResponseEntity.ok(Map.of("message", "Block reset for " + member.getEmail()));
    }

    // Add a member to MY tenant (tenantId forced from my token, NOT from request)
    @PostMapping("/users")
    public ResponseEntity<?> addUser(@AuthenticationPrincipal User admin,
                                     @RequestBody RegisterRequest req) {
        if (users.findByEmail(req.email()).isPresent()) {
            return ResponseEntity.status(409).body(Map.of("error", "email already registered"));
        }
        User u = new User();
        u.setTenantId(admin.getTenantId());            // forced to admin's own tenant
        u.setEmail(req.email());
        u.setPasswordHash(encoder.encode(req.password()));
        u.setRole(req.role() == null ? Role.MEMBER : req.role());
        users.save(u);
        return ResponseEntity.ok(Map.of("id", u.getId(), "email", u.getEmail(), "role", u.getRole().name()));
    }

    // Update a member in MY tenant
    @PutMapping("/users/{id}")
    public ResponseEntity<?> updateUser(@AuthenticationPrincipal User admin,
                                        @PathVariable Long id,
                                        @RequestBody RegisterRequest req) {
        var opt = users.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "user not found"));
        }
        User u = opt.get();
        // tenant-ownership check: can only edit users in my own tenant
        if (!u.getTenantId().equals(admin.getTenantId())) {
            return ResponseEntity.status(403).body(Map.of("error", "not your tenant's user"));
        }
        if (req.email() != null && !req.email().isBlank()) {
            u.setEmail(req.email());
        }
        if (req.password() != null && !req.password().isBlank()) {
            u.setPasswordHash(encoder.encode(req.password()));
        }
        if (req.role() != null) {
            u.setRole(req.role());
        }
        users.save(u);
        return ResponseEntity.ok(Map.of("id", u.getId(), "email", u.getEmail(), "role", u.getRole().name()));
    }

    // Delete a member in MY tenant
    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@AuthenticationPrincipal User admin,
                                        @PathVariable Long id) {
        var opt = users.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "user not found"));
        }
        if (!opt.get().getTenantId().equals(admin.getTenantId())) {
            return ResponseEntity.status(403).body(Map.of("error", "not your tenant's user"));
        }
        users.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "user deleted", "id", id));
    }
}
