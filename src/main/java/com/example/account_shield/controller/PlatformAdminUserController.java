package com.example.account_shield.controller;

import com.example.account_shield.domain.Role;
import com.example.account_shield.entity.User;
import com.example.account_shield.repository.UserRepository;
import com.example.account_shield.web.dto.AuthDtos.RegisterRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/platform-admin/users")
public class PlatformAdminUserController {

    private final UserRepository users;
    private final PasswordEncoder encoder;

    public PlatformAdminUserController(UserRepository users, PasswordEncoder encoder) {
        this.users = users;
        this.encoder = encoder;
    }

    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody RegisterRequest req) {
        if (users.findByEmail(req.email()).isPresent()) {
            return ResponseEntity.status(409).body(Map.of("error", "email already registered"));
        }
        if (req.tenantId() == null) {
            return ResponseEntity.status(400).body(Map.of("error", "tenantId is required"));
        }
        User u = new User();
        u.setTenantId(req.tenantId());
        u.setEmail(req.email());
        u.setPasswordHash(encoder.encode(req.password()));
        u.setRole(req.role() == null ? Role.TENANT_ADMIN : req.role());
        users.save(u);
        return ResponseEntity.ok(Map.of(
                "email", u.getEmail(),
                "role", u.getRole().name(),
                "tenantId", u.getTenantId()
        ));
    }
}