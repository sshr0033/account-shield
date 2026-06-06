package com.example.account_shield.controller;

import com.example.account_shield.domain.Role;
import com.example.account_shield.entity.LoginAttempt;
import com.example.account_shield.entity.User;
import com.example.account_shield.repository.LoginAttemptRepository;
import com.example.account_shield.repository.UserRepository;
import com.example.account_shield.security.JwtService;
import com.example.account_shield.web.dto.AuthDtos.*;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final LoginAttemptRepository loginAttempts;

    public AuthController(UserRepository users,
                          PasswordEncoder encoder,
                          JwtService jwt,
                          LoginAttemptRepository loginAttempts) {
        this.users = users;
        this.encoder = encoder;
        this.jwt = jwt;
        this.loginAttempts = loginAttempts;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest req) {
        if (users.findByEmail(req.email()).isPresent()) {
            return ResponseEntity.status(409).body(Map.of("error", "email already registered"));
        }
        User u = new User();
        u.setTenantId(req.tenantId() == null ? 1L : req.tenantId());
        u.setEmail(req.email());
        u.setPasswordHash(encoder.encode(req.password()));
        u.setRole(req.role() == null ? Role.MEMBER : req.role());
        users.save(u);
        return ResponseEntity.ok(new AuthResponse(jwt.generate(u), u.getRole().name(), u.getEmail()));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req, HttpServletRequest httpReq) {
        String ip = extractClientIp(httpReq);
        Optional<User> opt = users.findByEmail(req.email());

        boolean success = opt.isPresent()
                && encoder.matches(req.password(), opt.get().getPasswordHash());

        recordAttempt(req.email(), ip, success,
                opt.map(User::getTenantId).orElse(null),
                opt.map(User::getId).orElse(null));

        if (!success) {
            return ResponseEntity.status(401).body(Map.of("error", "invalid credentials"));
        }

        User u = opt.get();
        return ResponseEntity.ok(new AuthResponse(jwt.generate(u), u.getRole().name(), u.getEmail()));
    }

    private void recordAttempt(String email, String ip, boolean success, Long tenantId, Long userId) {
        LoginAttempt attempt = new LoginAttempt();
        attempt.setEmailAttempted(email);
        attempt.setIpAddress(ip);
        attempt.setSuccess(success);
        attempt.setTenantId(tenantId == null ? 1L : tenantId);
        attempt.setUserId(userId);
        loginAttempts.save(attempt);
    }

    private String extractClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}