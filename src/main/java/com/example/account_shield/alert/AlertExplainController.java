package com.example.account_shield.alert;

import com.example.account_shield.ai.GeminiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/analyst/alerts")
public class AlertExplainController {

    private final AlertRepository alerts;
    private final GeminiService gemini;

    public AlertExplainController(AlertRepository alerts, GeminiService gemini) {
        this.alerts = alerts;
        this.gemini = gemini;
    }

    @PostMapping("/{id}/explain")
    public ResponseEntity<?> explain(@PathVariable Long id) {
        Optional<AlertEntity> opt = alerts.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "alert not found"));
        }
        AlertEntity alert = opt.get();

        String explanation = gemini.explainAlert(
                alert.getType().name(),
                alert.getSeverity().name(),
                alert.getDetails()
        );

        return ResponseEntity.ok(Map.of("alertId", id, "explanation", explanation));
    }
}