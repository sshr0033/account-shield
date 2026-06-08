package com.example.account_shield.controller;

import com.example.account_shield.entity.LoginAttempt;
import com.example.account_shield.repository.LoginAttemptRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.awt.print.Pageable;
import java.util.List;

@RestController
@RequestMapping("/api/analyst")
public class LoginActivityController {

    private final LoginAttemptRepository loginAttempts;

    public LoginActivityController(LoginAttemptRepository loginAttempts) {
        this.loginAttempts = loginAttempts;
    }

    @GetMapping("/login-attempts")
    public List<LoginAttempt> recentAttempts() {
        // most recent 50 attempts for tenant 1 (matching how alerts are scoped for now)
        return loginAttempts.findByTenantIdOrderByCreatedAtDesc(1L, PageRequest.of(0, 50));
    }
}