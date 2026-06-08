package com.example.account_shield.repository;

import com.example.account_shield.entity.Enquiry;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EnquiryRepository extends JpaRepository<Enquiry, Long> {
    List<Enquiry> findByStatusOrderByCreatedAtDesc(String status);
    List<Enquiry> findAllByOrderByCreatedAtDesc();
}