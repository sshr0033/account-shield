package com.example.account_shield.controller;

import com.example.account_shield.entity.Tenant;
import com.example.account_shield.repository.TenantRepository;
import com.example.account_shield.web.dto.AuthDtos;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.example.account_shield.repository.UserRepository;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.Map;
@RestController
@RequestMapping("/api/platform-admin/tenants")
public class TenantController {

    private final TenantRepository tenants;
    private final UserRepository users;

    public TenantController(TenantRepository tenants, UserRepository users) {
        this.tenants = tenants;
        this.users = users;
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody AuthDtos.CreateTenantRequest req) {
        Tenant t = new Tenant();
        t.setName(req.name());
        Tenant saved = tenants.save(t);
        return ResponseEntity.ok(Map.of("id", saved.getId(), "name", saved.getName()));
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        users.deleteByTenantId(id);   // cascade: remove the tenant's users first
        tenants.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Tenant and its users deleted", "tenantId", id));
    }

}