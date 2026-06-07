package com.example.account_shield.ai;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Service
public class GeminiService {

    private final String apiKey;
    private final String apiUrl;
    private final RestClient restClient;

    public GeminiService(
            @Value("${gemini.api-key}") String apiKey,
            @Value("${gemini.api-url}") String apiUrl) {
        this.apiKey = apiKey;
        this.apiUrl = apiUrl;
        this.restClient = RestClient.create();
    }

    public String explainAlert(String alertType, String severity, String details) {
        String prompt = """
                You are a security analyst assistant for a superannuation fund's fraud detection system.
                An alert has fired. Explain in 2-3 plain-English sentences what this alert means,
                why it likely fired, and what the analyst should do about it.

                Alert type: %s
                Severity: %s
                Details: %s
                """.formatted(alertType, severity, details);

        // Build the request body in Gemini's expected format
        Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(
                                Map.of("text", prompt)
                        ))
                )
        );

        try {
            Map<String, Object> response = restClient.post()
                    .uri(apiUrl + "?key=" + apiKey)
                    .header("Content-Type", "application/json")
                    .body(requestBody)
                    .retrieve()
                    .body(Map.class);

            return extractText(response);
        } catch (Exception e) {
            String msg = e.getMessage() == null ? "" : e.getMessage();
            if (msg.contains("429") || msg.contains("RESOURCE_EXHAUSTED")) {
                return "AI explanation is temporarily unavailable (language model rate limit reached). "
                        + "This is a " + alertType.toLowerCase().replace("_", " ")
                        + " alert of " + severity + " severity — review the details and investigate the source IP/account.";
            }
            return "AI explanation is temporarily unavailable. Please try again shortly.";
        }
    }

    @SuppressWarnings("unchecked")
    private String extractText(Map<String, Object> response) {
        try {
            List<Map<String, Object>> candidates =
                    (List<Map<String, Object>>) response.get("candidates");
            Map<String, Object> content =
                    (Map<String, Object>) candidates.get(0).get("content");
            List<Map<String, Object>> parts =
                    (List<Map<String, Object>>) content.get("parts");
            return (String) parts.get(0).get("text");
        } catch (Exception e) {
            return "Explanation unavailable (unexpected response format).";
        }
    }
}