package com.example.account_shield.web.dto;

import com.example.account_shield.domain.Role;

public class AuthDtos {
    public record RegisterRequest(String email, String password, Role role, Long tenantId) {}
    public record LoginRequest(String email, String password) {}
    public record AuthResponse(String token, String role, String email) {}
    public record CreateTenantRequest(String name) {}
}