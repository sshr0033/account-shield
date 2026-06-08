package com.example.account_shield.controller;

import com.example.account_shield.ratelimit.RateLimiterService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/platform-admin")
public class AdminController {

    private final RateLimiterService rateLimiter;

    public AdminController(RateLimiterService rateLimiter) {
        this.rateLimiter = rateLimiter;
    }

    @PostMapping("/reset-blocks")
    public ResponseEntity<?> resetBlocks() {
        rateLimiter.resetAll();
        return ResponseEntity.ok(Map.of("message", "All IP blocks have been cleared."));
    }
}