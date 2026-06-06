package com.example.account_shield.security;

import com.example.account_shield.domain.Role;
import com.example.account_shield.entity.User;
import com.example.account_shield.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository users;
    private final PasswordEncoder encoder;

    public DataSeeder(UserRepository users, PasswordEncoder encoder) {
        this.users = users;
        this.encoder = encoder;
    }

    @Override
    public void run(String... args) {
        seed("member@demo.test", "Member123!", Role.MEMBER);
        seed("analyst@demo.test", "Analyst123!", Role.FRAUD_ANALYST);
        seed("tenant-admin@demo.test", "TenantAdmin123!", Role.TENANT_ADMIN);
        seed("platform-admin@demo.test", "PlatformAdmin123!", Role.PLATFORM_ADMIN);
    }

    private void seed(String email, String rawPassword, Role role) {
        if (users.findByEmail(email).isPresent()) return;
        User u = new User();
        u.setTenantId(1L);
        u.setEmail(email);
        u.setPasswordHash(encoder.encode(rawPassword));
        u.setRole(role);
        users.save(u);
    }
}