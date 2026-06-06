package com.example.account_shield.controller;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class RoleController {

    @GetMapping("/me")
    public Map<String, Object> me(Authentication auth) {
        if (auth == null) return Map.of("authenticated", false);
        return Map.of("authenticated", true,
                "email", auth.getName(),
                "authorities", auth.getAuthorities().toString());
    }

    @GetMapping("/analyst/ping")
    public Map<String, String> analystPing() {
        return Map.of("message", "analyst access ok");
    }
}