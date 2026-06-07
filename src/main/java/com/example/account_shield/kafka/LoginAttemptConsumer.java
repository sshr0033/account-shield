package com.example.account_shield.kafka;

import com.example.account_shield.alert.DetectionService;
import com.example.account_shield.entity.LoginAttempt;
import com.example.account_shield.repository.LoginAttemptRepository;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class LoginAttemptConsumer {

    private final LoginAttemptRepository loginAttempts;
    private final DetectionService detection;

    public LoginAttemptConsumer(LoginAttemptRepository loginAttempts, DetectionService detection) {
        this.loginAttempts = loginAttempts;
        this.detection = detection;
    }

    @KafkaListener(topics = LoginAttemptProducer.TOPIC, groupId = "account-shield-detection")
    public void onLoginAttempt(String loginAttemptId) {
        Long id = Long.valueOf(loginAttemptId);

        Optional<LoginAttempt> opt = loginAttempts.findById(id);
        if (opt.isEmpty()) {
            return; // attempt not found — nothing to analyze
        }

        detection.analyzeAttempt(opt.get());
    }
}