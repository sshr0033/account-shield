package com.example.account_shield.controller;

import com.example.account_shield.entity.Enquiry;
import com.example.account_shield.repository.EnquiryRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/enquiries")
public class EnquiryController {

    private final EnquiryRepository enquiries;

    public EnquiryController(EnquiryRepository enquiries) {
        this.enquiries = enquiries;
    }

    @PostMapping
    public ResponseEntity<?> submit(@RequestBody Map<String, String> body) {
        String company = body.get("companyName");
        String email = body.get("contactEmail");
        if (company == null || company.isBlank() || email == null || email.isBlank()) {
            return ResponseEntity.status(400).body(Map.of("error", "companyName and contactEmail are required"));
        }
        Enquiry e = new Enquiry();
        e.setCompanyName(company);
        e.setContactEmail(email);
        e.setMessage(body.get("message"));
        enquiries.save(e);
        return ResponseEntity.ok(Map.of("message", "Thank you — your request has been received."));
    }
}