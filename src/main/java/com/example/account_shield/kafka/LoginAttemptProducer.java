package com.example.account_shield.kafka;

import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
public class LoginAttemptProducer {

    public static final String TOPIC = "login-attempts";

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public LoginAttemptProducer(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void publishAttemptId(Long loginAttemptId) {
        kafkaTemplate.send(TOPIC, String.valueOf(loginAttemptId));
    }
}