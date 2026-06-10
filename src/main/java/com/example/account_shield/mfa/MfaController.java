package com.example.account_shield.mfa;

import com.example.account_shield.entity.User;
import com.example.account_shield.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

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
        String email = ((User) authentication.getPrincipal()).getEmail();
        Optional<User> opt = users.findByEmail(email);
        if (opt.isEmpty()) return ResponseEntity.status(404).body(Map.of("error", "user not found"));
        User user = opt.get();

        String secret = mfa.generateSecret();

        // Only save the secret temporarily — MFA not enabled yet until confirmed
        user.setMfaSecret(secret);
        user.setMfaEnabled(false);  // stays false until /confirm
        users.save(user);

        String qrDataUri = mfa.generateQrCodeDataUri(email, secret);
        return ResponseEntity.ok(Map.of(
                "message", "Scan this QR code with your authenticator app",
                "qrCode", qrDataUri
        ));
    }@PostMapping("/confirm")
    public ResponseEntity<?> confirm(@RequestBody Map<String, String> body,
                                     Authentication authentication) {
        String email = ((User) authentication.getPrincipal()).getEmail();
        Optional<User> opt = users.findByEmail(email);
        if (opt.isEmpty()) return ResponseEntity.status(404).body(Map.of("error", "user not found"));

        User user = opt.get();
        String code = body.get("mfaCode");

        if (!mfa.verifyCode(user.getMfaSecret(), code)) {
            return ResponseEntity.status(401).body(Map.of("error", "invalid MFA code"));
        }

        // Code is valid — now actually enable MFA
        user.setMfaEnabled(true);
        users.save(user);

        return ResponseEntity.ok(Map.of("message", "MFA enabled successfully"));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMe(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(Map.of(
                "email", user.getEmail(),
                "role", user.getRole().name(),
                "mfaEnabled", user.isMfaEnabled()
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