package com.example.account_shield.alert;


import org.springframework.data.jpa.repository.JpaRepository;

public interface AlertRepository extends JpaRepository<AlertEntity, Long> {
}