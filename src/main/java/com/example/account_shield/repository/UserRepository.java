package com.example.account_shield.repository;

import com.example.account_shield.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    @Modifying
    @Transactional
    @Query("DELETE FROM User u WHERE u.tenantId = :tenantId")
    void deleteByTenantId(@Param("tenantId") Long tenantId);
    List<User> findByTenantId(Long tenantId);
}

