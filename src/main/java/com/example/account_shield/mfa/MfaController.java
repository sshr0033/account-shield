package com.example.account_shield.mfa;

import com.example.account_shield.entity.User;
import com.example.account_shield.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
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
        String email = ((com.example.account_shield.entity.User) authentication.getPrincipal()).getEmail();

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
    @PostMapping("/confirm")
    public ResponseEntity<?> confirmMfa(
            Authentication authentication,
            @RequestBody Map<String, String> body) {

        String email = ((User) authentication.getPrincipal()).getEmail();
        Optional<User> opt = users.findByEmail(email);

        if (opt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "user not found"));
        }

        User user = opt.get();
        String code = body.get("mfaCode");

        // Verify the code against the secret
        if (!mfa.verifyCode(user.getMfaSecret(), code)) {
            return ResponseEntity.status(401).body(Map.of("error", "invalid MFA code"));
        }

        // Code is valid - MFA is now confirmed and enabled
        // (Note: it may already be enabled from /enroll, but this confirms it works)
        user.setMfaEnabled(true);
        users.save(user);

        return ResponseEntity.ok(Map.of(
                "message", "MFA confirmed and enabled",
                "success", true
        ));
    }
    @PostMapping("/verify")
    public ResponseEntity<?> verify(
            Authentication authentication,
            @RequestBody Map<String, String> body) {

        String mfaCode = body.get("mfaCode");
        if (mfaCode == null || mfaCode.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "MFA code required"));
        }

        String email = ((User) authentication.getPrincipal()).getEmail();
        Optional<User> opt = users.findByEmail(email);

        if (opt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "user not found"));
        }

        User user = opt.get();

        // Verify the code
        if (!mfa.verifyCode(user.getMfaSecret(), mfaCode)) {
            return ResponseEntity.status(401).body(Map.of("error", "invalid MFA code"));
        }

        // Code is valid, MFA is already enabled (set during enroll)
        return ResponseEntity.ok(Map.of(
                "message", "MFA verified and enabled",
                "mfaEnabled", user.isMfaEnabled()
        ));
    }
}