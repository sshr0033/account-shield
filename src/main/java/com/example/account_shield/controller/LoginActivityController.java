package com.example.account_shield.controller;

import com.example.account_shield.entity.LoginAttempt;
import com.example.account_shield.entity.User;
import com.example.account_shield.repository.LoginAttemptRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.example.account_shield.entity.User;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

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
    public List<LoginAttempt> recentAttempts(@AuthenticationPrincipal User user) {
        return loginAttempts.findByTenantIdOrderByCreatedAtDesc(user.getTenantId(), PageRequest.of(0, 50));
    }
}