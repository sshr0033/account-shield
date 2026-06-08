package com.example.account_shield.ratelimit;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
public class RateLimiterService {

    private final StringRedisTemplate redis;

    // After this many failed attempts from one IP, block further attempts
    private static final int MAX_FAILURES = 5;
    // The counter resets after this window
    private static final Duration WINDOW = Duration.ofMinutes(10);

    public RateLimiterService(StringRedisTemplate redis) {
        this.redis = redis;
    }

    private String keyFor(String ip) {
        return "failed_attempts:" + ip;
    }

    // Is this IP currently blocked? (already at or over the limit)
    public boolean isBlocked(String ip) {
        String value = redis.opsForValue().get(keyFor(ip));
        if (value == null) return false;
        return Integer.parseInt(value) >= MAX_FAILURES;
    }

    // Record a failed attempt: increment the counter, set expiry on first failure
    public void recordFailure(String ip) {
        String key = keyFor(ip);
        Long count = redis.opsForValue().increment(key); // atomic +1, creates key if absent
        if (count != null && count == 1L) {
            // first failure for this IP — start the expiry clock
            redis.expire(key, WINDOW);
        }
    }

    private String keyForEmail(String email) {
        return "failed_attempts:email:" + email;
    }

    // Record a failed attempt for a specific account (email), for visibility/admin reset
    public void recordFailureForEmail(String email) {
        if (email == null || email.isBlank()) return;
        String key = keyForEmail(email);
        Long count = redis.opsForValue().increment(key);
        if (count != null && count == 1L) {
            redis.expire(key, WINDOW);
        }
    }

    // How many recent failures for this account
    public int currentCountForEmail(String email) {
        String value = redis.opsForValue().get(keyForEmail(email));
        return value == null ? 0 : Integer.parseInt(value);
    }

    // Reset a specific member's failure counter (admin action)
    public void resetForEmail(String email) {
        redis.delete(keyForEmail(email));
    }
    // Clear the counter (e.g. on a successful login)
    public void reset(String ip) {
        redis.delete(keyFor(ip));
    }

    // How many failures so far (useful for messages/debugging)
    public int currentCount(String ip) {
        String value = redis.opsForValue().get(keyFor(ip));
        return value == null ? 0 : Integer.parseInt(value);
    }

    // Clear ALL rate-limit counters (admin "reset all blocks")
    public void resetAll() {
        var keys = redis.keys("failed_attempts:*");
        if (keys != null && !keys.isEmpty()) {
            redis.delete(keys);
        }
    }
}