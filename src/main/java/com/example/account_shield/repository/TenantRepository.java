package com.example.account_shield.repository;


import com.example.account_shield.entity.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;


public interface TenantRepository extends JpaRepository<Tenant, Long> {
}
