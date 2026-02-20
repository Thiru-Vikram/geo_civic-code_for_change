package backend.geocivic.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

/**
 * AiClient — the ONLY class that communicates with the external LLM API.
 *
 * Design decisions:
 * – Uses RestTemplate (already on the classpath via spring-boot-starter-web).
 * – API key is injected from application.properties — NEVER hardcoded here.
 * – Accepts a pre-built list of message objects so ChatService controls the
 * prompt.
 * – Returns only the assistant's reply text; JSON parsing stays here.
 *
 * To switch AI providers (e.g. OpenAI → Gemini), change only this file
 * and the two properties in application.properties.
 */
@Component
public class AiClient {

    private static final Logger log = LoggerFactory.getLogger(AiClient.class);

    @Value("${ai.api.url}")
    private String apiUrl;

    @Value("${ai.api.key}")
    private String apiKey;

    @Value("${ai.model}")
    private String model;

    @Value("${ai.max.tokens:500}")
    private int maxTokens;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Calls the external LLM API with the given message list.
     *
     * @param messages List of message maps. Each map must contain "role" and
     *                 "content" keys.
     *                 Example: [{"role":"system","content":"..."},
     *                 {"role":"user","content":"..."}]
     * @return The assistant's reply text, trimmed and ready to display.
     */
    @SuppressWarnings("unchecked")
    public String chat(List<Map<String, String>> messages) {

        // ── 1. Build HTTP headers ─────────────────────────────────────────────
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey); // Authorization: Bearer <key>

        // ── 2. Build request body (OpenAI-compatible format) ──────────────────
        Map<String, Object> body = Map.of(
                "model", model,
                "messages", messages,
                "max_tokens", maxTokens,
                "temperature", 0.7 // balanced: factual but conversational
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        // ── 3. Send POST and parse response ───────────────────────────────────
        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(apiUrl, request, Map.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                List<Map<String, Object>> choices = (List<Map<String, Object>>) response.getBody().get("choices");

                if (choices != null && !choices.isEmpty()) {
                    Map<String, Object> firstChoice = choices.get(0);
                    Map<String, String> messageBlock = (Map<String, String>) firstChoice.get("message");
                    return messageBlock.getOrDefault("content", "").trim();
                }
            }

            log.warn("AiClient: unexpected response status={}", response.getStatusCode());
            return "I'm having trouble connecting to the AI service right now. Please try again.";

        } catch (Exception ex) {
            log.error("AiClient: error calling AI API", ex);
            return "Sorry, the AI assistant is temporarily unavailable. Please try again later.";
        }
    }
}
