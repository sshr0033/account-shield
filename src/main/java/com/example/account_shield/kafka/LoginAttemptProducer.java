package com.example.account_shield.kafka;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
public class LoginAttemptProducer {

    private static final Logger log = LoggerFactory.getLogger(LoginAttemptProducer.class);
    public static final String TOPIC = "login-attempts";

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public LoginAttemptProducer(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void publishAttemptId(Long loginAttemptId) {
        try {
            kafkaTemplate.send(TOPIC, String.valueOf(loginAttemptId))
                    .whenComplete((result, ex) -> {
                        if (ex != null) {
                            log.warn("Could not publish login attempt {} to Kafka: {}",
                                    loginAttemptId, ex.getMessage());
                        }
                    });
        } catch (Exception e) {
            log.warn("Kafka publish failed for attempt {}: {}", loginAttemptId, e.getMessage());
        }
    }
}