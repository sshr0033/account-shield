package com.example.account_shield.mfa;

import com.example.account_shield.entity.User;
import com.example.account_shield.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/me/mfa")
public class MfaController {

    private final UserRepository users;
    private final MfaService mfa;

    public MfaController(UserRepository users, MfaService mfa) {
        this.users = users;
        this.mfa = mfa;
    }

    @PostMapping("/enroll")
    public ResponseEntity<?> enroll(Authentication authentication) {
        // who is logged in? their email is the JWT subject
        String email = authentication.getName();

        Optional<User> opt = users.findByEmail(email);
        if (opt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "user not found"));
        }
        User user = opt.get();

        // 1. generate a fresh secret
        String secret = mfa.generateSecret();

        // 2. save it on the user and turn MFA on
        user.setMfaSecret(secret);
        user.setMfaEnabled(true);
        users.save(user);

        // 3. build the QR code the user scans with their authenticator app
        String qrDataUri = mfa.generateQrCodeDataUri(email, secret);

        return ResponseEntity.ok(Map.of(
                "message", "Scan this QR code with your authenticator app",
                "qrCode", qrDataUri
        ));
    }
}