package com.example.account_shield.controller;

import com.example.account_shield.entity.Tenant;
import com.example.account_shield.repository.TenantRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("/api")
public class HealthController
{
    private TenantRepository tenantRepository;

    public HealthController(TenantRepository tenantRepository)
    {
        this.tenantRepository = tenantRepository;
    }

    @GetMapping("/healthCheck")
    public Map<String,Object> health()
    {
        return  Map.of("status", "ok", "tenantCount", tenantRepository.count());
    }

    @GetMapping("/tenants")
    public List<Tenant> findAll()
    {
        return tenantRepository.findAll();
    }
}
